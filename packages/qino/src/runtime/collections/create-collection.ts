import fs from "node:fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import type {
  Collection,
  CreateCollectionParams,
  GetterOptions,
  ObjectSchema,
  Relations,
  ResolvedView,
  SupportedFileExtension,
} from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { validate } from "../../lib/standard-schema";
import { QinoMeta } from "../globals";
import { register } from "../registry";
import { buildMeta } from "./build-meta";
import { resolveCollectionDirectory } from "./resolve-collection-directory";
import { resolveEntry, createResolveCache } from "../relations";

const CONTENT_FIELD_NAME = "markdown";

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = {},
  DefaultR extends ResolveOption = true,
>({
  relativePath,
  schema,
  extension,
  relations,
  resolveRelations,
}: CreateCollectionParams<S, Ext, Rels, DefaultR>) {
  const collectionRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  async function getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedView<S, Ext, Rels, R>>> {
    const collectionDirectory = await resolveCollectionDirectory(relativePath);

    const relFilePaths = await fg(`**/*${extension}`, {
      cwd: collectionDirectory,
    });

    const rawEntries = await Promise.all(
      relFilePaths.map(async (relPath) => {
        const meta = buildMeta({
          directory: collectionDirectory,
          relativePath: relPath,
          extension,
        });

        const rawFileData = await fs.readFile(
          nodePath.join(collectionDirectory, relPath),
          "utf-8",
        );

        return { meta, raw: rawFileData };
      }),
    );

    const validated = rawEntries.map(({ meta, raw }) => {
      if (extension == ".json") {
        return {
          _meta: meta,
          ...validate(schema, JSON.parse(raw), meta.filePath),
        };
      }
      const parsed = matter(raw);
      return {
        _meta: meta,
        ...validate(
          schema,
          { [CONTENT_FIELD_NAME]: parsed.content, ...parsed.data },
          meta.filePath,
        ),
      };
    });

    const effectiveResolve: ResolveOption =
      options?.resolveRelations ?? defaultResolve;
    if (effectiveResolve === false) {
      return validated as Array<ResolvedView<S, Ext, Rels, R>>;
    }

    const cache = createResolveCache();
    const resolved = await Promise.all(
      validated.map((entry) =>
        resolveEntry(entry, collection, effectiveResolve, cache),
      ),
    );
    return resolved as Array<ResolvedView<S, Ext, Rels, R>>;
  }

  async function getOne<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedView<S, Ext, Rels, R>> {
    const collectionDirectory = await resolveCollectionDirectory(relativePath);

    const meta = buildMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const data = await fs.readFile(meta.filePath, "utf-8");

    const validated =
      extension == ".json"
        ? {
            _meta: meta,
            ...validate(schema, JSON.parse(data), meta.filePath),
          }
        : (() => {
            const parsed = matter(data);
            return {
              _meta: meta,
              ...validate(
                schema,
                { [CONTENT_FIELD_NAME]: parsed.content, ...parsed.data },
                meta.filePath,
              ),
            };
          })();

    const effectiveResolve: ResolveOption =
      options?.resolveRelations ?? defaultResolve;

    if (effectiveResolve === false) {
      return validated as ResolvedView<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolved = await resolveEntry(
      validated,
      collection,
      effectiveResolve,
      cache,
    );
    return resolved as ResolvedView<S, Ext, Rels, R>;
  }

  const collection = {
    [QinoMeta]: {
      schema,
      path: relativePath,
      extension,
      relations: collectionRelations,
      resolveRelations: defaultResolve,
    },
    getAll,
    getOne,
  } as const satisfies Collection<S, Ext, Rels, DefaultR>;

  register(collection);

  return collection;
}
