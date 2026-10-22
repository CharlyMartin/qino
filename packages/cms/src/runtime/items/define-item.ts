import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data/globals";
import { assertCloudEnabled } from "../../lib/cloud/assert-cloud-enabled";
import { assertMediaConfig } from "../../lib/media/assert-media-config";
import { resolveEntryMedia } from "../../lib/media/resolve-entry-media";
import { parseFile } from "../../lib/parse/parse-file";
import { assertContentPath } from "../../lib/paths/assert-content-path";
import { extractExtension } from "../../lib/paths/extract-extension";
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { assertMarkdownStatsConfig } from "../../lib/stats/assert-markdown-stats-config";
import { validate } from "../../lib/validate/validate";
import { applyView } from "../../lib/views/apply-view";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import { buildViews } from "../../lib/views/build-views";
import { selectView } from "../../lib/views/select-view";
import type { ItemCloudConfig } from "../../types/cloud";
import type {
  ExtractItemExtension,
  Item,
  ItemEntryMeta,
  ItemFile,
  ResolvedItemView,
} from "../../types/item";
import type { CheckMarkdownStats } from "../../types/markdown-stats";
import type {
  CheckMediaKeys,
  MediaConfig,
  TaggedRelations,
} from "../../types/media";
import type { Relations } from "../../types/relations";
import type { NoReservedSchemaFields } from "../../types/reserved-schema-fields";
import type { ObjectSchema } from "../../types/schema";
import type { EmptyObject, NoLeadingSlash } from "../../types/utils";
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
  Media extends MediaConfig<Schema, ExtractItemExtension<F>> = EmptyObject,
  Stats extends boolean = false,
> = {
  file: F & NoInfer<NoLeadingSlash<F>>;
  schema: Schema &
    NoInfer<NoReservedSchemaFields<Schema, ExtractItemExtension<F>>>;
  relations?: Rels;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media &
    NoInfer<CheckMediaKeys<Media, Schema, ExtractItemExtension<F>>>;
  /** Adds `_stats` (word and character counts) from the Markdown body. */
  markdownStats?: Stats &
    NoInfer<CheckMarkdownStats<Stats, ExtractItemExtension<F>>>;
  views?: ViewsConfig<
    Views,
    ViewFactory<
      Schema,
      ItemEntryMeta<ExtractItemExtension<F>>,
      TaggedRelations<Rels, Media, Stats>
    >
  >;
  cloud?: NoInfer<ItemCloudConfig<Schema>>;
} & RootViewSettings;

export function defineItem<
  S extends ObjectSchema,
  F extends ItemFile,
  Rels extends Relations<S> = object,
  const Views extends object = object,
  const Media extends MediaConfig<S, ExtractItemExtension<F>> = EmptyObject,
  const Stats extends boolean = false,
>(ctx: QinoContext, params: DefineItemParams<S, F, Rels, Views, Media, Stats>) {
  type TaggedRels = TaggedRelations<Rels, Media, Stats>;
  const {
    file,
    schema,
    relations,
    media = {},
    markdownStats = false,
    cloud,
  } = params;
  assertContentPath(file, "file");
  assertCloudEnabled(ctx, cloud, file);

  type Ext = ExtractItemExtension<F>;
  const extension = extractExtension(file) as Ext;
  const itemRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: itemRelations,
    extension,
    primitiveId: file,
  });
  assertMarkdownStatsConfig({ markdownStats, extension, primitiveId: file });
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
      contentFolder: ctx.contentFolder,
      schema,
      file,
      extension,
      relations: itemRelations,
      resolveRelations: defaultResolve,
      media,
      markdownStats,
      cloud,
      readEntry,
    },
    getEntry,
  } as const satisfies Item<S, Ext, TaggedRels, ConfiguredViews<Views>>;

  return item;

  async function readEntry() {
    const meta = buildItemMeta({ filePath: absoluteFilePath });

    const raw = await fs.readFile(absoluteFilePath, "utf-8");

    const entry = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: absoluteFilePath,
        validatorFn: validate,
      }),
    };
    return (await resolveEntryMedia({
      entry: await addEntryStats({ entry, markdownStats }),
      media,
      mediaFolder: ctx.mediaFolder,
      filePath: absoluteFilePath,
    })) as ResolvedItemView<S, Ext, TaggedRels, false>;
  }

  async function getEntry<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options);
    const entry = await readEntry();
    const [result] = await applyView(
      [entry],
      view,
      itemRelations,
      ctx.instanceId,
    );
    return result as SelectedView<
      S,
      ItemEntryMeta<Ext>,
      TaggedRels,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
