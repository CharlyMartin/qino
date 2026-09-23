import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data/globals";
import { parseFile } from "../../lib/parse/parse-file";
import { extractExtension } from "../../lib/paths/extract-extension";
import { validate } from "../../lib/validate/validate";
import { applyView } from "../../lib/views/apply-view";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import { buildViews } from "../../lib/views/build-views";
import { selectView } from "../../lib/views/select-view";
import type {
  ExtractItemExtension,
  Item,
  ItemEntryMeta,
  ItemFile,
} from "../../types/item";
import type { Relations } from "../../types/relations";
import type { NoReservedSchemaFields } from "../../types/reserved-schema-fields";
import type { ObjectSchema } from "../../types/schema";
import type {
  ConfiguredViews,
  RootViewSettings,
  SelectedView,
  ViewArguments,
  ViewFactory,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import type { QinoContext } from "../qino/init-qino";
import { buildItemMeta } from "./build-item-meta";

export type DefineItemParams<
  Schema extends ObjectSchema,
  F extends ItemFile,
  Rels extends Relations<Schema> = object,
  Views extends object = object,
> = {
  file: F;
  schema: Schema & NoInfer<NoReservedSchemaFields<Schema>>;
  relations?: Rels;
  views?: ViewsConfig<
    Views,
    ViewFactory<Schema, ItemEntryMeta<ExtractItemExtension<F>>, Rels>
  >;
} & RootViewSettings;

export function defineItem<
  S extends ObjectSchema,
  F extends ItemFile,
  Rels extends Relations<S> = object,
  const Views extends object = object,
>(ctx: QinoContext, params: DefineItemParams<S, F, Rels, Views>) {
  const { file, schema, relations } = params;

  type Ext = ExtractItemExtension<F>;
  const extension = extractExtension(file) as Ext;
  const itemRelations = (relations ?? {}) as Rels;
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "item");
  const defaultResolve = views?.default.resolveRelations ?? false;

  const absoluteFilePath = nodePath.join(
    ctx.contentFolder,
    file,
  ) as `${string}${Ext}`;

  const item = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.item,
      instanceId: ctx.instanceId,
      schema,
      file,
      extension,
      relations: itemRelations,
      resolveRelations: defaultResolve,
      readData,
    },
    getData,
  } as const satisfies Item<S, Ext, Rels, ConfiguredViews<Views>>;

  return item;

  async function readData() {
    const meta = buildItemMeta({ filePath: absoluteFilePath });

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
      itemRelations,
      ctx.instanceId,
    );
    return result as SelectedView<
      S,
      ItemEntryMeta<Ext>,
      Rels,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
