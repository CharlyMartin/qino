import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  applyView,
  buildViews,
  parseFile,
  selectView,
  validate,
} from "../../lib";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import type {
  ExtractSingletonExtension,
  ObjectSchema,
  Relations,
  Singleton,
  SingletonFile,
} from "../../types";
import type { SingletonEntryMeta } from "../../types/singleton";
import type {
  ConfiguredViews,
  RootViewSettings,
  SelectedView,
  ViewArguments,
  ViewFactory,
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
  Views extends object = object,
> = {
  file: F;
  schema: Schema;
  relations?: Rels;
  views?: ViewsConfig<
    Views,
    ViewFactory<Schema, SingletonEntryMeta<ExtractSingletonExtension<F>>, Rels>
  >;
} & RootViewSettings;

export function createSingleton<
  S extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<S> = object,
  const Views extends object = object,
>(ctx: QinoContext, params: CreateSingletonParams<S, F, Rels, Views>) {
  const { file, schema, relations } = params;

  type Ext = ExtractSingletonExtension<F>;
  const extension = extractExtension(file) as Ext;
  const singletonRelations = (relations ?? {}) as Rels;
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "singleton");
  const defaultResolve = views?.default.resolveRelations ?? false;

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
  } as const satisfies Singleton<S, Ext, Rels, ConfiguredViews<Views>>;

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

  async function getData<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options);
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
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
