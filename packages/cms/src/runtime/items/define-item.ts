import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data/globals";
import type { DependencyCollector } from "../../lib/cache/create-dependency-collector";
import { createFileCache } from "../../lib/cache/create-file-cache";
import { assertCloudEnabled } from "../../lib/cloud/assert-cloud-enabled";
import { resolveMarkdownConfig } from "../../lib/markdown/resolve-markdown-config";
import { assertMediaConfig } from "../../lib/media/assert-media-config";
import { resolveEntryMedia } from "../../lib/media/resolve-entry-media";
import { parseFile } from "../../lib/parse/parse-file";
import { assertContentPath } from "../../lib/paths/assert-content-path";
import { extractExtension } from "../../lib/paths/extract-extension";
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { addEntryToc } from "../../lib/toc/add-entry-toc";
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
import type {
  CheckMarkdownConfig,
  MarkdownConfig,
} from "../../types/markdown-config";
import type { MarkdownTocFlag } from "../../types/markdown-toc";
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
  Media extends MediaConfig<Schema> = EmptyObject,
  Stats extends boolean = false,
  Toc extends MarkdownTocFlag = false,
> = {
  file: F & NoInfer<NoLeadingSlash<F>>;
  schema: Schema &
    NoInfer<NoReservedSchemaFields<Schema, ExtractItemExtension<F>>>;
  // The `NoInfer` half types `parse` callbacks: an object holding one is
  // inferred last, so without it the callback would see the default.
  relations?: Rels & NoInfer<Relations<Schema>>;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media & NoInfer<MediaConfig<Schema> & CheckMediaKeys<Media, Schema>>;
  /** Configures the Markdown body: `_stats`, `_toc`, and the files it embeds. */
  markdown?: MarkdownConfig<Stats, Toc> &
    NoInfer<CheckMarkdownConfig<ExtractItemExtension<F>>>;
  views?: ViewsConfig<
    Views,
    ViewFactory<
      Schema,
      ItemEntryMeta<ExtractItemExtension<F>>,
      TaggedRelations<Rels, Media, Stats, Toc>
    >
  >;
  cloud?: NoInfer<ItemCloudConfig<Schema>>;
} & RootViewSettings;

export function defineItem<
  S extends ObjectSchema,
  F extends ItemFile,
  const Rels extends Relations<S> = object,
  const Views extends object = object,
  const Media extends MediaConfig<S> = EmptyObject,
  const Stats extends boolean = false,
  Toc extends MarkdownTocFlag = false,
>(
  ctx: QinoContext,
  params: DefineItemParams<S, F, Rels, Views, Media, Stats, Toc>,
) {
  type TaggedRels = TaggedRelations<Rels, Media, Stats, Toc>;
  const { file, schema, relations, media = {}, cloud } = params;
  assertContentPath(file, "file");
  assertCloudEnabled(ctx, cloud, file);

  type Ext = ExtractItemExtension<F>;
  const extension = extractExtension(file) as Ext;
  const itemRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: itemRelations,
    primitiveId: file,
  });
  const markdown = resolveMarkdownConfig({
    markdown: params.markdown,
    extension,
    primitiveId: file,
  });
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "item", itemRelations);
  const defaultResolveDepth = views?.default.resolveDepth ?? {};

  const absoluteFilePath = nodePath.join(
    ctx.contentFolder,
    file,
  ) as `${string}${Ext}`;
  const fileCache = createFileCache();

  const item = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.item,
      instanceId: ctx.instanceId,
      contentFolder: ctx.contentFolder,
      schema,
      file,
      extension,
      relations: itemRelations,
      resolveDepth: defaultResolveDepth,
      media,
      markdown,
      cloud,
      readEntry,
    },
    getEntry,
  } as const satisfies Item<S, Ext, TaggedRels, ConfiguredViews<Views>>;

  return item;

  async function readEntry(dependencies?: DependencyCollector) {
    const entry = await fileCache.read(
      absoluteFilePath,
      parseEntry,
      dependencies,
    );
    // Images are read per call: an edited image keeps its entry's cache key.
    // The copy keeps top-level writes to a returned entry out of the cache.
    return (await resolveEntryMedia({
      entry: { ...entry },
      media,
      mediaFolder: ctx.mediaFolder,
      filePath: absoluteFilePath,
      dependencies,
    })) as ResolvedItemView<S, Ext, TaggedRels>;
  }

  // Everything here depends on the file alone, so it's cached by file.
  async function parseEntry(data: string) {
    const entry = {
      [META_FIELD_NAME]: buildItemMeta({ filePath: absoluteFilePath }),
      ...parseFile({
        schema,
        data,
        filePath: absoluteFilePath,
        validatorFn: validate,
      }),
    };
    return addEntryToc({
      entry: await addEntryStats({ entry, markdownStats: markdown.stats }),
      markdownToc: markdown.toc,
      extension,
    });
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
