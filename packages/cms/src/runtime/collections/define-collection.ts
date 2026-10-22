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
import { buildEntryMeta } from "../../lib/meta/build-entry-meta";
import { parseFile } from "../../lib/parse/parse-file";
import { assertContentPath } from "../../lib/paths/assert-content-path";
import { removeExtension } from "../../lib/paths/remove-extension";
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { assertMarkdownStatsConfig } from "../../lib/stats/assert-markdown-stats-config";
import { validate } from "../../lib/validate/validate";
import { applyView } from "../../lib/views/apply-view";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import { buildViews } from "../../lib/views/build-views";
import { selectView } from "../../lib/views/select-view";
import type {
  CollectionCloudConfig,
  DisplayEntryAsConfig,
  SaveEntryAsConfig,
} from "../../types/cloud";
import type {
  Collection,
  CollectionEntryMeta,
  ResolvedCollectionView,
} from "../../types/collection";
import type {
  CollectionViewDefinition,
  CollectionViewFactory,
} from "../../types/collection-views";
import type { CheckMarkdownStats } from "../../types/markdown-stats";
import type {
  CheckMediaKeys,
  MediaConfig,
  TaggedRelations,
} from "../../types/media";
import type { Relations } from "../../types/relations";
import type { NoReservedSchemaFields } from "../../types/reserved-schema-fields";
import type { ObjectSchema } from "../../types/schema";
import type { SlugFor } from "../../types/slug-registry";
import type {
  ContentPath,
  EmptyObject,
  NoLeadingSlash,
  Slug,
  SupportedFileExtension,
} from "../../types/utils";
import type {
  ConfiguredViews,
  RootViewSettings,
  SelectedView,
  ViewArguments,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import type { QinoContext } from "../qino/init-qino";
import { globCollectionPaths } from "./glob-collection-paths";

export type DefineCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  Dir extends ContentPath = ContentPath,
  Views extends object = object,
  SaveEntryAs extends string = never,
  DisplayEntryAs extends string = never,
  Media extends MediaConfig<Schema, Ext> = EmptyObject,
  Stats extends boolean = false,
> = {
  directory: Dir & NoInfer<NoLeadingSlash<Dir>>;
  schema: Schema & NoInfer<NoReservedSchemaFields<Schema, Ext>>;
  extension: Ext;
  relations?: Rels;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media & NoInfer<CheckMediaKeys<Media, Schema, Ext>>;
  /** Adds `_stats` (word and character counts) from the Markdown body. */
  markdownStats?: Stats & NoInfer<CheckMarkdownStats<Stats, Ext>>;
  views?: ViewsConfig<
    Views,
    CollectionViewFactory<
      Schema,
      CollectionEntryMeta<Ext>,
      TaggedRelations<Rels, Media, Stats>
    >,
    CollectionViewDefinition
  >;
  cloud?: NoInfer<CollectionCloudConfig<Schema>> &
    SaveEntryAsConfig<SaveEntryAs, Schema> &
    DisplayEntryAsConfig<DisplayEntryAs, Schema>;
} & RootViewSettings;

export function defineCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  Dir extends ContentPath = ContentPath,
  const Views extends object = object,
  const SaveEntryAs extends string = never,
  const DisplayEntryAs extends string = never,
  const Media extends MediaConfig<S, Ext> = EmptyObject,
  const Stats extends boolean = false,
>(
  ctx: QinoContext,
  params: DefineCollectionParams<
    S,
    Ext,
    Rels,
    Dir,
    Views,
    SaveEntryAs,
    DisplayEntryAs,
    Media,
    Stats
  >,
) {
  type TaggedRels = TaggedRelations<Rels, Media, Stats>;
  const {
    directory,
    schema,
    extension,
    relations,
    media = {},
    markdownStats = false,
    cloud,
  } = params;
  assertContentPath(directory, "directory");
  assertCloudEnabled(ctx, cloud, directory);
  const collectionRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: collectionRelations,
    extension,
    primitiveId: directory,
  });
  assertMarkdownStatsConfig({
    markdownStats,
    extension,
    primitiveId: directory,
  });
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "collection");
  const defaultResolve = views?.default.resolveRelations ?? false;
  const collectionDirectory = nodePath.join(ctx.contentFolder, directory);

  const collection = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.collection,
      instanceId: ctx.instanceId,
      contentFolder: ctx.contentFolder,
      schema,
      directory,
      extension,
      relations: collectionRelations,
      resolveRelations: defaultResolve,
      media,
      markdownStats,
      cloud,
      readEntries,
      readEntry,
    },
    getEntries,
    getAllSlugs,
    getEntry,
  } as const satisfies Collection<
    S,
    Ext,
    TaggedRels,
    Dir,
    ConfiguredViews<Views>
  >;

  return collection;

  async function getAllSlugs() {
    const paths = await globCollectionPaths({
      absoluteDirPath: collectionDirectory,
      extension,
    });

    return paths.map((path) => removeExtension(path) as SlugFor<Dir>).sort();
  }

  async function readEntry(slug: Slug) {
    const meta = buildEntryMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });
    const data = await fs.readFile(meta.filePath, "utf-8");
    const entry = {
      ...parseFile({
        schema,
        data,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
      [META_FIELD_NAME]: meta,
    };
    return (await resolveEntryMedia({
      entry: await addEntryStats({ entry, markdownStats }),
      media,
      mediaFolder: ctx.mediaFolder,
      filePath: meta.filePath,
    })) as ResolvedCollectionView<S, Ext, TaggedRels, false>;
  }

  async function readEntries() {
    const paths = await globCollectionPaths({
      absoluteDirPath: collectionDirectory,
      extension,
    });
    return Promise.all(
      paths.map((path) => readEntry(path.slice(0, -extension.length))),
    );
  }

  async function getEntries<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options) as CollectionViewDefinition;
    const entries = await readEntries();
    const augmented = await applyView(
      entries,
      view,
      collectionRelations,
      ctx.instanceId,
    );
    const { filter, sort } = view;
    const filtered = filter
      ? augmented.filter((entry) => filter(entry as never))
      : augmented;
    return (
      sort
        ? filtered.toSorted((a, b) => sort(a as never, b as never))
        : filtered
    ) as Array<
      SelectedView<
        S,
        CollectionEntryMeta<Ext>,
        TaggedRels,
        ConfiguredViews<Views>,
        ViewSelection<Args[0]>
      >
    >;
  }

  async function getEntry<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(slug: Slug, ...[options]: Args) {
    const view = selectView(views, options) as CollectionViewDefinition;
    const entry = await readEntry(slug);
    const [result] = await applyView(
      [entry],
      view,
      collectionRelations,
      ctx.instanceId,
    );
    if (view.filter && !view.filter(result as never)) {
      throw new Error(
        `Entry "${slug}" in collection "${directory}" is excluded by view "${options?.view ?? "default"}".`,
      );
    }
    return result as SelectedView<
      S,
      CollectionEntryMeta<Ext>,
      TaggedRels,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
