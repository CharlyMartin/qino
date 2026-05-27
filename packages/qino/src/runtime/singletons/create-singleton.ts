import fs from "node:fs/promises";

import { META_FIELD_NAME, QinoMeta } from "../../data";
import {
  createRelationResolver,
  createResolveCache,
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
  Singleton,
  SingletonFile,
} from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { extractExtension } from "../../utils/extract-extension";
import { buildSingletonMeta } from "./build-singleton-meta";
import { resolveSingletonFile } from "./resolve-singleton-file";

type CreateSingletonParams<
  Schema extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  file: F;
  schema: Schema;
  relations?: Rels;
  resolveRelations?: DefaultR;
};

export function createSingleton<
  S extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
>({
  file,
  schema,
  relations,
  resolveRelations,
}: CreateSingletonParams<S, F, Rels, DefaultR>) {
  type Ext = ExtractSingletonExtension<F>;
  const extension = extractExtension(file) as Ext;
  const singletonRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;

  const singleton = {
    [QinoMeta]: {
      is: "singleton",
      schema,
      file,
      extension,
      relations: singletonRelations,
      resolveRelations: defaultResolve,
    },
    getData,
  } as const satisfies Singleton<S, Ext, Rels, DefaultR>;

  return singleton;

  async function getData<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<ResolvedSingletonView<S, Ext, Rels, R>> {
    const absoluteFilePath = await resolveSingletonFile(file);

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

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as ResolvedSingletonView<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await resolver.resolveEntry(validatedDataWithMeta, {
      relations: singleton[QinoMeta].relations,
      depth,
    });
    return resolved as ResolvedSingletonView<S, Ext, Rels, R>;
  }
}
