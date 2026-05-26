import fs from "node:fs/promises";

import {
  createResolveCache,
  META_FIELD_NAME,
  QinoMeta,
  resolveEntry,
  validateJsonFile,
  validateMarkdownFile,
} from "../../lib";
import type {
  CreateSingletonParams,
  ExtractSingletonExtension,
  GetterOptions,
  ObjectSchema,
  Relations,
  ResolvedSingletonView,
  Singleton,
  SingletonFile,
} from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { buildSingletonMeta } from "./build-singleton-meta";
import { extractExtension } from "./extract-extension";
import { resolveSingletonFile } from "./resolve-singleton-file";

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

    const validatorFn =
      extension == ".json" ? validateJsonFile : validateMarkdownFile;

    const validatedDataWithMeta = {
      [META_FIELD_NAME]: meta,
      ...validatorFn({
        schema,
        raw,
        filePath: absoluteFilePath,
      }),
    };

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as ResolvedSingletonView<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolved = await resolveEntry(
      validatedDataWithMeta,
      singleton,
      resolveSetting,
      cache,
    );
    return resolved as ResolvedSingletonView<S, Ext, Rels, R>;
  }
}
