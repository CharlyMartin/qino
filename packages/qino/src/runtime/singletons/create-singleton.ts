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
import { parseFile } from "../../lib/parse/parse-file";
import { normalizeDepth } from "../../lib/relations/normalize-depth";
import type {
  ExtractSingletonExtension,
  GetterOptions,
  ObjectSchema,
  Relations,
  ResolvedSingletonView,
  ResolveOption,
  Singleton,
  SingletonFile,
  TransformOutput,
} from "../../types";
import type { SingletonEntryMeta } from "../../types/entry";
import type { EntryTransform } from "../../types/transform";
import { extractExtension } from "../../utils/extract-extension";
import type { QinoContext } from "../qino/create-qino";
import { buildSingletonMeta } from "./build-singleton-meta";

export type CreateSingletonParams<
  Schema extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
  Derived extends TransformOutput = {},
> = {
  file: F;
  schema: Schema;
  relations?: Rels;
  resolveRelations?: DefaultR;
  transform?: EntryTransform<
    Schema,
    SingletonEntryMeta<ExtractSingletonExtension<F>>,
    Derived
  >;
};

export function createSingleton<
  S extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
  Derived extends TransformOutput = {},
>(
  ctx: QinoContext,
  params: CreateSingletonParams<S, F, Rels, DefaultR, Derived>,
) {
  const { file, schema, relations, resolveRelations, transform } = params;

  type Ext = ExtractSingletonExtension<F>;
  const extension = extractExtension(file) as Ext;
  const singletonRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  const absoluteFilePath = nodePath.join(
    ctx.contentFolder,
    file,
  ) as `${string}${Ext}`;

  const singleton = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.singleton,
      instanceId: ctx.instanceId,
      schema,
      file,
      extension,
      relations: singletonRelations,
      resolveRelations: defaultResolve,
    },
    getData,
  } as const satisfies Singleton<S, Ext, Rels, DefaultR, Derived>;

  return singleton;

  async function getData<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<ResolvedSingletonView<S, Ext, Rels, R, Derived>> {
    const meta = buildSingletonMeta({ filePath: absoluteFilePath });

    const raw = await fs.readFile(absoluteFilePath, "utf-8");

    const validatedDataWithMeta = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: absoluteFilePath,
        validatorFn: validate,
      }),
    };

    const transformedEntry = await transformEntry(
      validatedDataWithMeta,
      transform,
    );

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return transformedEntry as ResolvedSingletonView<
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
      relations: singleton[QinoPrimitiveMarker].relations,
      depth,
      sourceInstanceId: ctx.instanceId,
    });
    return resolved as ResolvedSingletonView<S, Ext, Rels, R, Derived>;
  }
}
