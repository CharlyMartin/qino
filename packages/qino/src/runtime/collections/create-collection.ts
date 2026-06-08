import fs from "node:fs/promises";
import nodePath from "node:path";

import fg from "fast-glob";

import { META_FIELD_NAME, QinoMeta, QinoPrimitives } from "../../data";
import {
  createRelationResolver,
  createResolveCache,
  validate,
} from "../../lib";
import { buildEntryMeta } from "../../lib/meta/build-entry-meta";
import { parseFile } from "../../lib/parse/parse-file";
import { normalizeDepth } from "../../lib/relations/normalize-depth";
import type {
  Collection,
  GenericPath,
  GetterOptions,
  ObjectSchema,
  Relations,
  ResolvedCollectionView,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";
import type { Slug } from "../../types/utils";
import type { QinoContext } from "../qino/create-qino";

export type CreateCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  directory: GenericPath;
  schema: Schema;
  extension: Ext;
  relations?: Rels;
  resolveRelations?: DefaultR;
};

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
>(ctx: QinoContext, params: CreateCollectionParams<S, Ext, Rels, DefaultR>) {
  const { directory, schema, extension, relations, resolveRelations } = params;

  const collectionRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  const collectionDirectory = nodePath.join(
    ctx.config.contentFolder,
    directory,
  );

  const collection = {
    [QinoMeta]: {
      is: QinoPrimitives.collection,
      instanceId: ctx.instanceId,
      config: ctx.config,
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
  ): Promise<Array<ResolvedCollectionView<S, Ext, Rels, R>>> {
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
      return validatedDataWithMeta as Array<
        ResolvedCollectionView<S, Ext, Rels, R>
      >;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await Promise.all(
      validatedDataWithMeta.map((entry) =>
        resolver.resolveEntry(entry, {
          relations: collection[QinoMeta].relations,
          depth,
          sourceInstanceId: ctx.instanceId,
        }),
      ),
    );
    return resolved as Array<ResolvedCollectionView<S, Ext, Rels, R>>;
  }

  async function getOne<R extends ResolveOption = DefaultR>(
    slug: Slug,
    options?: GetterOptions<R>,
  ): Promise<ResolvedCollectionView<S, Ext, Rels, R>> {
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
      return validatedDataWithMeta as ResolvedCollectionView<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await resolver.resolveEntry(validatedDataWithMeta, {
      relations: collection[QinoMeta].relations,
      depth,
      sourceInstanceId: ctx.instanceId,
    });
    return resolved as ResolvedCollectionView<S, Ext, Rels, R>;
  }
}
