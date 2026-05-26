import fs from "node:fs/promises";
import nodePath from "node:path";

import fg from "fast-glob";

import {
  createResolveCache,
  META_FIELD_NAME,
  QinoMeta,
  resolveEntry,
  validate,
} from "../../lib";
import { parseFile } from "../../lib/parse/parse-file";
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
import { buildEntryMeta } from "./build-entry-meta";
import { resolveCollectionDirectory } from "./resolve-collection-directory";

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
>({
  directory,
  schema,
  extension,
  relations,
  resolveRelations,
}: CreateCollectionParams<S, Ext, Rels, DefaultR>) {
  const collectionRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  const collection = {
    [QinoMeta]: {
      is: "collection",
      schema,
      directory,
      extension,
      relations: collectionRelations,
      resolveRelations: defaultResolve,
    },
    getAll,
    getOne,
  } as const satisfies Collection<S, Ext, Rels, DefaultR>;

  return collection;

  async function getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedView<S, Ext, Rels, R>>> {
    const collectionDirectory = await resolveCollectionDirectory(directory);

    const relFilePaths = await fg(`**/*${extension}`, {
      cwd: collectionDirectory,
    });

    const rawEntries = await Promise.all(
      relFilePaths.map(async (relPath) => {
        const meta = buildEntryMeta({
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

    const validatedDataWithMeta = rawEntries.map(({ meta, raw }) => {
      const validatedData = parseFile({
        schema,
        data: raw,
        filePath: meta.filePath,
        validatorFn: validate,
      });

      return {
        [META_FIELD_NAME]: meta,
        ...validatedData,
      };
    });

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as Array<ResolvedView<S, Ext, Rels, R>>;
    }

    const cache = createResolveCache();
    const resolved = await Promise.all(
      validatedDataWithMeta.map((entry) =>
        resolveEntry(entry, collection, resolveSetting, cache),
      ),
    );
    return resolved as Array<ResolvedView<S, Ext, Rels, R>>;
  }

  async function getOne<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedView<S, Ext, Rels, R>> {
    const collectionDirectory = await resolveCollectionDirectory(directory);

    const meta = buildEntryMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const data = await fs.readFile(meta.filePath, "utf-8");

    const validatedDataWithMeta = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
    };

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as ResolvedView<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolved = await resolveEntry(
      validatedDataWithMeta,
      collection,
      resolveSetting,
      cache,
    );
    return resolved as ResolvedView<S, Ext, Rels, R>;
  }
}
