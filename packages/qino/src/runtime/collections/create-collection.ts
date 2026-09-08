import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  createRelationResolver,
  createResolveCache,
  transformEntry,
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
  TransformOutput,
} from "../../types";
import type { CollectionEntryMeta } from "../../types/entry";
import type { EntryTransform } from "../../types/transform";
import type { Slug } from "../../types/utils";
import type { QinoContext } from "../qino/create-qino";
import { globCollectionPaths } from "./glob-collection-paths";

export type CreateCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
  Dir extends GenericPath = GenericPath,
  Derived extends TransformOutput = {},
> = {
  directory: Dir;
  schema: Schema;
  extension: Ext;
  relations?: Rels;
  resolveRelations?: DefaultR;
  transform?: EntryTransform<Schema, CollectionEntryMeta<Ext>, Derived>;
};

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
  Dir extends GenericPath = GenericPath,
  Derived extends TransformOutput = {},
>(
  ctx: QinoContext,
  params: CreateCollectionParams<S, Ext, Rels, DefaultR, Dir, Derived>,
) {
  const {
    directory,
    schema,
    extension,
    relations,
    resolveRelations,
    transform,
  } = params;

  const collectionRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  const collectionDirectory = nodePath.join(ctx.contentFolder, directory);

  const collection = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.collection,
      instanceId: ctx.instanceId,
      schema,
      directory,
      extension,
      relations: collectionRelations,
      resolveRelations: defaultResolve,
    },
    getAll,
    getOne,
  } as const satisfies Collection<S, Ext, Rels, DefaultR, Dir, Derived>;

  return collection;

  async function getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedCollectionView<S, Ext, Rels, R, Derived>>> {
    const relFilePaths = await globCollectionPaths({
      absoluteDirPath: collectionDirectory,
      extension,
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

    const validatedDataWithMeta = await Promise.all(
      rawEntries.map(async ({ meta, raw }) => {
        const validatedData = parseFile({
          schema,
          data: raw,
          filePath: meta.filePath,
          validatorFn: validate,
        });

        const entryWithMeta = {
          ...validatedData,
          [META_FIELD_NAME]: meta,
        };

        return transformEntry(entryWithMeta, transform);
      }),
    );

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as unknown as Array<
        ResolvedCollectionView<S, Ext, Rels, R, Derived>
      >;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await Promise.all(
      validatedDataWithMeta.map((entry) =>
        resolver.resolveEntry(entry, {
          relations: collection[QinoPrimitiveMarker].relations,
          depth,
          sourceInstanceId: ctx.instanceId,
        }),
      ),
    );
    return resolved as Array<ResolvedCollectionView<S, Ext, Rels, R, Derived>>;
  }

  async function getOne<R extends ResolveOption = DefaultR>(
    slug: Slug,
    options?: GetterOptions<R>,
  ): Promise<ResolvedCollectionView<S, Ext, Rels, R, Derived>> {
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

    const transformedEntry = await transformEntry(
      validatedDataWithMeta,
      transform,
    );

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return transformedEntry as ResolvedCollectionView<
        S,
        Ext,
        Rels,
        R,
        Derived
      >;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await resolver.resolveEntry(transformedEntry, {
      relations: collection[QinoPrimitiveMarker].relations,
      depth,
      sourceInstanceId: ctx.instanceId,
    });
    return resolved as ResolvedCollectionView<S, Ext, Rels, R, Derived>;
  }
}
