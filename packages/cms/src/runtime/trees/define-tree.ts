import nodePath from "node:path";

import {
  DEFAULT_ORDER_FILE_NAME,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data/globals";
import { buildAgentMarkdown } from "../../lib/agent-markdown/build-agent-markdown";
import { buildIndexAgentMarkdown } from "../../lib/agent-markdown/build-index-agent-markdown";
import { toListingLink } from "../../lib/agent-markdown/to-listing-link";
import type { DependencyCollector } from "../../lib/cache/create-dependency-collector";
import { createDerivedCache } from "../../lib/cache/create-derived-cache";
import { createFileCache } from "../../lib/cache/create-file-cache";
import { createInFlightCache } from "../../lib/cache/create-in-flight-cache";
import { assertCloudEnabled } from "../../lib/cloud/assert-cloud-enabled";
import { resolveMarkdownConfig } from "../../lib/markdown/resolve-markdown-config";
import { assertMediaConfig } from "../../lib/media/assert-media-config";
import { resolveEntryMedia } from "../../lib/media/resolve-entry-media";
import { buildEntryMeta } from "../../lib/meta/build-entry-meta";
import { requirePages } from "../../lib/pages/require-pages";
import { resolvePages } from "../../lib/pages/resolve-pages";
import { toPagesMarkdownUrl } from "../../lib/pages/to-pages-markdown-url";
import { toPagesUrl } from "../../lib/pages/to-pages-url";
import { parseFile } from "../../lib/parse/parse-file";
import { assertContentPath } from "../../lib/paths/assert-content-path";
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { addEntryToc } from "../../lib/toc/add-entry-toc";
import { validate } from "../../lib/validate/validate";
import { applyView } from "../../lib/views/apply-view";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import { buildViews } from "../../lib/views/build-views";
import { selectView } from "../../lib/views/select-view";
import type { AgentMarkdownConfig } from "../../types/agent-markdown";
import type {
  DisplayEntryAsConfig,
  SaveEntryAsConfig,
  TreeCloudConfig,
} from "../../types/cloud";
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
import type { PagesConfig } from "../../types/pages";
import type { Relations } from "../../types/relations";
import type { NoReservedSchemaFields } from "../../types/reserved-schema-fields";
import type { ObjectSchema } from "../../types/schema";
import type { SlugFor } from "../../types/slug-registry";
import type {
  ResolvedTreeEntry,
  StringKeys,
  Tree,
  TreeEntryMeta,
  TreeNode,
} from "../../types/tree";
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
  ViewFactory,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import type { QinoContext } from "../qino/init-qino";
import { findAncestorNodes } from "./find-ancestor-nodes";
import { findNode } from "./find-node";
import { flattenTree } from "./flatten-tree";
import { getNeighborNode } from "./get-neighbor-node";
import { walkTree } from "./walk-tree";

export type DefineTreeParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<Schema>,
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
  titleField: Title;
  orderFileName?: string;
  // The `NoInfer` half types `parse` callbacks: an object holding one is
  // inferred last, so without it the callback would see the default.
  relations?: Rels & NoInfer<Relations<Schema>>;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media & NoInfer<MediaConfig<Schema> & CheckMediaKeys<Media, Schema>>;
  /** Configures the Markdown body: `_stats`, `_toc`, and the files it embeds. */
  markdown?: MarkdownConfig<Stats, Toc> & NoInfer<CheckMarkdownConfig<Ext>>;
  views?: ViewsConfig<
    Views,
    ViewFactory<
      Schema,
      TreeEntryMeta<Ext>,
      TaggedRelations<Rels, Media, Stats, Toc>
    >
  >;
  cloud?: NoInfer<TreeCloudConfig<Schema>> &
    SaveEntryAsConfig<SaveEntryAs, Schema> &
    DisplayEntryAsConfig<DisplayEntryAs, Schema>;
  /** Where the index page and entry pages live, for agent Markdown and links. */
  pages?: PagesConfig;
  /** Configures the entry pages' agent Markdown: how MDX components read. */
  agentMarkdown?: NoInfer<
    AgentMarkdownConfig<
      ResolvedTreeEntry<Schema, Ext, TaggedRelations<Rels, Media, Stats, Toc>>
    >
  > &
    NoInfer<CheckMarkdownConfig<Ext>>;
} & RootViewSettings;

export function defineTree<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<S>,
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
  params: DefineTreeParams<
    S,
    Ext,
    Title,
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
  const {
    directory,
    schema,
    extension,
    titleField,
    orderFileName,
    relations,
    media = {},
    cloud,
  } = params;
  assertContentPath(directory, "directory");
  const owner = `Tree "${directory}"`;
  const resolvedPages = resolvePages({
    pages: params.pages,
    siteUrl: ctx.siteUrl,
    owner,
  });
  assertCloudEnabled(ctx, cloud, directory);

  const treeRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: treeRelations,
    primitiveId: directory,
  });
  const markdown = resolveMarkdownConfig({
    markdown: params.markdown,
    extension,
    primitiveId: directory,
  });
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "tree", treeRelations);
  const defaultResolveDepth = views?.default.resolveDepth ?? {};
  const resolvedOrderFileName = orderFileName ?? DEFAULT_ORDER_FILE_NAME;
  const directoryPath = nodePath.join(ctx.contentFolder, directory);
  // Parsed files are shared by tree walks and entry reads. Stats and the table
  // of contents, which only entry reads need, are derived once per parse.
  const fileCache = createFileCache();
  const entryCache = createDerivedCache();
  // Concurrent calls, such as a page's sidebar and its neighbor links, share
  // one walk.
  const walks = createInFlightCache();

  const tree = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.tree,
      instanceId: ctx.instanceId,
      contentFolder: ctx.contentFolder,
      schema,
      directory,
      extension,
      titleField,
      orderFileName: resolvedOrderFileName,
      relations: treeRelations,
      resolveDepth: defaultResolveDepth,
      media,
      markdown,
      cloud,
      ...(resolvedPages && {
        pages: {
          ...resolvedPages,
          getListingSections,
          getLlmsFullDocuments,
        },
      }),
      readEntry,
    },
    getTree,
    getFlatTree,
    getEntries,
    getEntry,
    getAncestorNodes,
    getNextNode,
    getPreviousNode,
    getAgentMarkdown,
    getMarkdownUrl,
  } as const satisfies Tree<
    S,
    Ext,
    Title,
    TaggedRels,
    Dir,
    ConfiguredViews<Views>
  >;

  return tree;

  async function getTree(): Promise<Array<TreeNode>>;
  async function getTree(slug: Slug): Promise<TreeNode>;
  async function getTree(slug?: Slug) {
    // Each call gets its own nodes, so changing them affects no other call.
    const nodes = structuredClone(await walks.run("tree", walk));

    if (typeof slug == "undefined") return nodes;
    return findNode(nodes, slug, directory);
  }

  async function walk() {
    const nodes = await walkTree({
      directoryPath,
      readParsed,
      extension,
      titleField,
      orderFileName: resolvedOrderFileName,
    });
    // A walk lists every file, so it frees removed and renamed ones.
    fileCache.retain(flattenTree(nodes).map((node) => node.filePath));
    return nodes;
  }

  async function getFlatTree() {
    return flattenTree(await getTree());
  }

  async function readEntry(slug: Slug, dependencies?: DependencyCollector) {
    const meta = buildEntryMeta({
      directory: directoryPath,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const parsed = await readParsed(meta.filePath, dependencies);
    const entry = await entryCache.read(parsed, () =>
      addMarkdownFields(meta, parsed),
    );
    // Images are read per call: an edited image keeps its entry's cache key.
    // The copy keeps top-level writes to a returned entry out of the cache.
    return (await resolveEntryMedia({
      entry: { ...entry },
      media,
      mediaFolder: ctx.mediaFolder,
      contentFolder: ctx.contentFolder,
      filePath: meta.filePath,
      dependencies,
    })) as ResolvedTreeEntry<S, Ext, TaggedRels>;
  }

  async function readParsed(
    filePath: string,
    dependencies?: DependencyCollector,
  ) {
    // A copy per file: the entry cache keys on this object, and a JSON schema
    // transform can return one object, such as a lookup, for several files.
    return fileCache.read(
      filePath,
      async (data) => ({
        ...(parseFile({
          schema,
          data,
          filePath,
          validatorFn: validate,
        }) as Record<string, unknown>),
      }),
      dependencies,
    );
  }

  async function addMarkdownFields(
    meta: TreeEntryMeta<Ext>,
    parsed: Record<string, unknown>,
  ) {
    const entry = { [META_FIELD_NAME]: meta, ...parsed };
    return addEntryToc({
      entry: await addEntryStats({ entry, markdownStats: markdown.stats }),
      markdownToc: markdown.toc,
      extension,
    });
  }

  async function getEntry<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(slug: Slug, ...[options]: Args) {
    const view = selectView(views, options);
    const entry = await readEntry(slug);
    const [result] = await applyView(
      [entry],
      view,
      treeRelations,
      ctx.instanceId,
    );
    return result as SelectedView<
      S,
      TreeEntryMeta<Ext>,
      TaggedRels,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }

  async function getEntries<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options);
    const nodes = await getFlatTree();
    const entries = await Promise.all(
      nodes.map((node) => readEntry(node.slug)),
    );
    const results = await applyView(
      entries,
      view,
      treeRelations,
      ctx.instanceId,
    );
    return results as Array<
      SelectedView<
        S,
        TreeEntryMeta<Ext>,
        TaggedRels,
        ConfiguredViews<Views>,
        ViewSelection<Args[0]>
      >
    >;
  }

  async function getAncestorNodes(slug: Slug) {
    return findAncestorNodes({ tree: await getTree(), slug, directory });
  }

  async function getNextNode(slug: Slug) {
    return getNeighborNode({
      tree: await getTree(),
      slug,
      directory,
      offset: 1,
    });
  }

  async function getPreviousNode(slug: Slug) {
    return getNeighborNode({
      tree: await getTree(),
      slug,
      directory,
      offset: -1,
    });
  }

  async function getAgentMarkdown(): Promise<string>;
  async function getAgentMarkdown(slug: Slug): Promise<string | null>;
  async function getAgentMarkdown(slug?: Slug) {
    const pages = requirePages(resolvedPages, { owner, option: "pages" });
    // Only a missing slug means the index page: `""` is a slug no node has.
    if (typeof slug == "undefined") {
      return buildIndexAgentMarkdown({
        title: pages.title,
        sections: await getListingSections(),
        canonical: toPagesUrl(pages),
      });
    }

    // Only a listed slug reads a file: a route param can't reach past the
    // tree with `..`.
    const nodes = await getFlatTree();
    if (!nodes.some((node) => node.slug == slug)) return null;

    return readEntryAgentMarkdown(slug, toPagesUrl(pages, slug));
  }

  // `llms-full.txt`'s documents: every node, in its sections' order, without
  // frontmatter blocks.
  async function getLlmsFullDocuments() {
    const nodes = await getFlatTree();
    return Promise.all(nodes.map((node) => readEntryAgentMarkdown(node.slug)));
  }

  // An entry page's. Tree views can't filter, so no view can exclude it. A
  // `canonical` adds the frontmatter block.
  async function readEntryAgentMarkdown(slug: Slug, canonical?: string) {
    const { siteUrl } = requirePages(resolvedPages, { owner, option: "pages" });
    const entry = await readEntry(slug);
    return buildAgentMarkdown({
      entry: entry as Record<string, unknown>,
      titleField,
      fallbackTitle: slug,
      extension,
      origin: siteUrl,
      replacement: { components: params.agentMarkdown?.components, entry },
      canonical,
    });
  }

  // A section per root node, listing it and then its descendants, in tree
  // order: the index page's and `llms.txt`'s.
  async function getListingSections() {
    const toLink = async (node: TreeNode) =>
      toListingLink({
        entry: (await readEntry(node.slug)) as Record<string, unknown>,
        titleField,
        fallbackTitle: node.slug,
        url: getMarkdownUrl(node.slug as SlugFor<Dir>),
      });
    return Promise.all(
      (await getTree()).map(async (root) => {
        const [rootLink, descendantLinks] = await Promise.all([
          toLink(root),
          Promise.all(flattenTree(root.children).map(toLink)),
        ]);
        // The root node titles its section, then lists first.
        return { title: rootLink.title, links: [rootLink, ...descendantLinks] };
      }),
    );
  }

  function getMarkdownUrl(slug?: SlugFor<Dir>) {
    const pages = requirePages(resolvedPages, { owner, option: "pages" });
    return toPagesMarkdownUrl(pages, slug);
  }
}
