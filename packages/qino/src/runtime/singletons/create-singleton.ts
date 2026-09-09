import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  applyView,
  assertViewNames,
  parseFile,
  type RuntimeView,
  selectView,
  validate,
} from "../../lib";
import type {
  AugmentOutput,
  ExtractSingletonExtension,
  ObjectSchema,
  Relations,
  ResolveOption,
  Singleton,
  SingletonFile,
} from "../../types";
import type { EntryAugment } from "../../types/augment";
import type { SingletonEntryMeta } from "../../types/entry";
import type {
  SelectedView,
  ViewArguments,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import { extractExtension } from "../../utils/extract-extension";
import type { QinoContext } from "../qino/create-qino";
import { buildSingletonMeta } from "./build-singleton-meta";

export type CreateSingletonParams<
  Schema extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = false,
  Derived extends AugmentOutput = {},
  Views extends object = object,
> = {
  file: F;
  schema: Schema;
  relations?: Rels;
  resolveRelations?: DefaultR;
  augment?: EntryAugment<
    Schema,
    SingletonEntryMeta<ExtractSingletonExtension<F>>,
    Derived,
    Rels,
    DefaultR
  >;
  views?: ViewsConfig<
    Schema,
    SingletonEntryMeta<ExtractSingletonExtension<F>>,
    Rels,
    Views
  >;
};

export function createSingleton<
  S extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = false,
  Derived extends AugmentOutput = {},
  const Views extends object = object,
>(
  ctx: QinoContext,
  params: CreateSingletonParams<S, F, Rels, DefaultR, Derived, Views>,
) {
  const { file, schema, relations, resolveRelations, augment } = params;

  type Ext = ExtractSingletonExtension<F>;
  const extension = extractExtension(file) as Ext;
  const singletonRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? false) as ResolveOption;
  const views = params.views as Record<string, RuntimeView> | undefined;
  assertViewNames(views);
  const defaults = { resolveRelations: defaultResolve, augment };

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
      readData,
    },
    getData,
  } as const satisfies Singleton<S, Ext, Rels, DefaultR, Derived, Views>;

  return singleton;

  async function readData() {
    const meta = buildSingletonMeta({ filePath: absoluteFilePath });

    const raw = await fs.readFile(absoluteFilePath, "utf-8");

    return {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: absoluteFilePath,
        validatorFn: validate,
      }),
    };
  }

  async function getData<Args extends ViewArguments<Views> = []>(
    ...[options]: Args
  ) {
    const view = selectView(defaults, views, options);
    const entry = await readData();
    const [result] = await applyView(
      [entry],
      view,
      singletonRelations,
      ctx.instanceId,
    );
    return result as SelectedView<
      S,
      SingletonEntryMeta<Ext>,
      Rels,
      DefaultR,
      Derived,
      Views,
      ViewSelection<Args[0]>
    >;
  }
}
