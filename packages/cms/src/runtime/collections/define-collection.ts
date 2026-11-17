import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data/globals";
import { createFileCache } from "../../lib/cache/create-file-cache";
import { assertCloudEnabled } from "../../lib/cloud/assert-cloud-enabled";
import { resolveMarkdownConfig } from "../../lib/markdown/resolve-markdown-config";
import { assertMediaConfig } from "../../lib/media/assert-media-config";
import { resolveEntryMedia } from "../../lib/media/resolve-entry-media";
import { buildEntryMeta } from "../../lib/meta/build-entry-meta";
import { assertPageOptions } from "../../lib/pagination/assert-page-options";
import { paginate } from "../../lib/pagination/paginate";
import { parseFile } from "../../lib/parse/parse-file";
import { assertContentPath } from "../../lib/paths/assert-content-path";
import { removeExtension } from "../../lib/paths/remove-extension";
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { addEntryToc } from "../../lib/toc/add-entry-toc";
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
  PaginatedEntries,
  ResolvedCollectionView,
} from "../../types/collection";
import type {
  CollectionViewDefinition,
  CollectionViewFactory,
} from "../../types/collection-views";
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
import type { SlugFor } from "../../types/slug-registry";
import type {
  ContentPath,
  EmptyObject,
  NoLeadingSlash,
  PageOptions,
  Slug,
  SupportedFileExtension,
} from "../../types/utils";
import type {
  ConfiguredViews,
  RootViewSettings,
  SelectedView,
  ViewArguments,
  ViewNames,
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
  Media extends MediaConfig<Schema> = EmptyObject,
  Stats extends boolean = false,
  Toc extends MarkdownTocFlag = false,
> = {
  directory: Dir & NoInfer<NoLeadingSlash<Dir>>;
  schema: Schema & NoInfer<NoReservedSchemaFields<Schema, Ext>>;
  extension: Ext;
  // The `NoInfer` half types `parse` callbacks: an object holding one is
  // inferred last, so without it the callback would see the default.
  relations?: Rels & NoInfer<Relations<Schema>>;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media & NoInfer<MediaConfig<Schema> & CheckMediaKeys<Media, Schema>>;
  /** Configures the Markdown body: `_stats`, `_toc`, and the files it embeds. */
  markdown?: MarkdownConfig<Stats, Toc> & NoInfer<CheckMarkdownConfig<Ext>>;
  views?: ViewsConfig<
    Views,
    CollectionViewFactory<
      Schema,
      CollectionEntryMeta<Ext>,
      TaggedRelations<Rels, Media, Stats, Toc>
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
  const Rels extends Relations<S> = object,
  Dir extends ContentPath = ContentPath,
  const Views extends object = object,
  const SaveEntryAs extends string = never,
  const DisplayEntryAs extends string = never,
  const Media extends MediaConfig<S> = EmptyObject,
  const Stats extends boolean = false,
  Toc extends MarkdownTocFlag = false,
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
    Stats,
    Toc
  >,
) {
  type TaggedRels = TaggedRelations<Rels, Media, Stats, Toc>;
  const { directory, schema, extension, relations, media = {}, cloud } = params;
  assertContentPath(directory, "directory");
  assertCloudEnabled(ctx, cloud, directory);
  const collectionRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: collectionRelations,
    primitiveId: directory,
  });
  const markdown = resolveMarkdownConfig({
    markdown: params.markdown,
    extension,
    primitiveId: directory,
  });
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "collection", collectionRelations);
  const defaultResolveDepth = views?.default.resolveDepth ?? {};
  const collectionDirectory = nodePath.join(ctx.contentFolder, directory);
  // Per collection: two collections over one directory can parse it apart.
  const fileCache = createFileCache();

  const collection = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.collection,
      instanceId: ctx.instanceId,
      contentFolder: ctx.contentFolder,
      schema,
      directory,
      extension,
      relations: collectionRelations,
      resolveDepth: defaultResolveDepth,
      media,
      markdown,
      cloud,
      readEntries,
      readEntry,
    },
    getEntries,
    getPaginatedEntries,
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
    // Frees removed and renamed files, which no read would ask for again.
    fileCache.retain(
      paths.map((path) => nodePath.join(collectionDirectory, path)),
    );

    return paths.map((path) => removeExtension(path) as SlugFor<Dir>).sort();
  }

  async function readEntry(slug: Slug) {
    const meta = buildEntryMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });
    const entry = await fileCache.read(meta.filePath, (data) =>
      parseEntry(meta, data),
    );
    // Images are read per call: an edited image keeps its entry's cache key.
    // The copy keeps top-level writes to a returned entry out of the cache.
    return (await resolveEntryMedia({
      entry: { ...entry },
      media,
      mediaFolder: ctx.mediaFolder,
      filePath: meta.filePath,
    })) as ResolvedCollectionView<S, Ext, TaggedRels>;
  }

  // Everything here depends on the file alone, so it's cached by file.
  async function parseEntry(meta: CollectionEntryMeta<Ext>, data: string) {
    const entry = {
      ...parseFile({
        schema,
        data,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
      [META_FIELD_NAME]: meta,
    };
    return addEntryToc({
      entry: await addEntryStats({ entry, markdownStats: markdown.stats }),
      markdownToc: markdown.toc,
      extension,
    });
  }

  // Slug order, so unsorted views and sort ties page the same on every call.
  async function readEntries() {
    const slugs = await getAllSlugs();
    return Promise.all(slugs.map((slug) => readEntry(slug)));
  }

  async function shapeEntries(
    entries: Array<ResolvedCollectionView<S, Ext, TaggedRels>>,
    view: CollectionViewDefinition,
  ) {
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
    return sort
      ? filtered.toSorted((a, b) => sort(a as never, b as never))
      : filtered;
  }

  async function getEntries<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options) as CollectionViewDefinition;
    return (await shapeEntries(await readEntries(), view)) as Array<
      SelectedView<
        S,
        CollectionEntryMeta<Ext>,
        TaggedRels,
        ConfiguredViews<Views>,
        ViewSelection<Args[0]>
      >
    >;
  }

  async function getPaginatedEntries<
    Options extends PageOptions<ViewNames<ConfiguredViews<Views>> | undefined>,
  >(page: number, options: Options) {
    const view = selectView(views, options) as CollectionViewDefinition;
    const pageOptions = {
      page,
      // A JavaScript caller can omit options; the check names the missing value.
      perPage: options?.perPage,
      owner: `Collection "${directory}" (view "${options?.view ?? "default"}")`,
    };
    // Before any read: a bad argument costs nothing and no content error hides
    // it. The upper bound needs the filtered total, so paginate checks it.
    assertPageOptions(pageOptions);

    // Without filter or sort, the page is known from slugs alone, so only its
    // files are read.
    const result =
      view.filter || view.sort
        ? paginate(await shapeEntries(await readEntries(), view), pageOptions)
        : await readPage(paginate(await getAllSlugs(), pageOptions), view);

    return result as PaginatedEntries<
      SelectedView<
        S,
        CollectionEntryMeta<Ext>,
        TaggedRels,
        ConfiguredViews<Views>,
        ViewSelection<Options>
      >
    >;
  }

  async function readPage(
    slugPage: PaginatedEntries<Slug>,
    view: CollectionViewDefinition,
  ) {
    const entries = await Promise.all(
      slugPage.entries.map((slug) => readEntry(slug)),
    );
    return { ...slugPage, entries: await shapeEntries(entries, view) };
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
