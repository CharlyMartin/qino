import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  DEFAULT_ORDER_FILE_NAME,
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
import { addEntryStats } from "../../lib/stats/add-entry-stats";
import { assertMarkdownStatsConfig } from "../../lib/stats/assert-markdown-stats-config";
import { validate } from "../../lib/validate/validate";
import { applyView } from "../../lib/views/apply-view";
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import { buildViews } from "../../lib/views/build-views";
import { selectView } from "../../lib/views/select-view";
import type {
  DisplayEntryAsConfig,
  SaveEntryAsConfig,
  TreeCloudConfig,
} from "../../types/cloud";
import type { CheckMarkdownStats } from "../../types/markdown-stats";
import type {
  CheckMediaKeys,
  MediaConfig,
  TaggedRelations,
} from "../../types/media";
import type { Relations } from "../../types/relations";
import type { NoReservedSchemaFields } from "../../types/reserved-schema-fields";
import type { ObjectSchema } from "../../types/schema";
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
  Media extends MediaConfig<Schema, Ext> = EmptyObject,
  Stats extends boolean = false,
> = {
  directory: Dir & NoInfer<NoLeadingSlash<Dir>>;
  schema: Schema & NoInfer<NoReservedSchemaFields<Schema, Ext>>;
  extension: Ext;
  titleField: Title;
  orderFileName?: string;
  relations?: Rels;
  /** Media fields, keyed by path. Image fields are read as `QinoImage`. */
  media?: Media & NoInfer<CheckMediaKeys<Media, Schema, Ext>>;
  /** Adds `_stats` (word and character counts) from the Markdown body. */
  markdownStats?: Stats & NoInfer<CheckMarkdownStats<Stats, Ext>>;
  views?: ViewsConfig<
    Views,
    ViewFactory<Schema, TreeEntryMeta<Ext>, TaggedRelations<Rels, Media, Stats>>
  >;
  cloud?: NoInfer<TreeCloudConfig<Schema>> &
    SaveEntryAsConfig<SaveEntryAs, Schema> &
    DisplayEntryAsConfig<DisplayEntryAs, Schema>;
} & RootViewSettings;

export function defineTree<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<S>,
  Rels extends Relations<S> = object,
  Dir extends ContentPath = ContentPath,
  const Views extends object = object,
  const SaveEntryAs extends string = never,
  const DisplayEntryAs extends string = never,
  const Media extends MediaConfig<S, Ext> = EmptyObject,
  const Stats extends boolean = false,
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
    Stats
  >,
) {
  type TaggedRels = TaggedRelations<Rels, Media, Stats>;
  const {
    directory,
    schema,
    extension,
    titleField,
    orderFileName,
    relations,
    media = {},
    markdownStats = false,
    cloud,
  } = params;
  assertContentPath(directory, "directory");
  assertCloudEnabled(ctx, cloud, directory);

  const treeRelations = (relations ?? {}) as TaggedRels;
  assertMediaConfig({
    media,
    relations: treeRelations,
    extension,
    primitiveId: directory,
  });
  assertMarkdownStatsConfig({
    markdownStats,
    extension,
    primitiveId: directory,
  });
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "tree");
  const defaultResolve = views?.default.resolveRelations ?? false;
  const resolvedOrderFileName = orderFileName ?? DEFAULT_ORDER_FILE_NAME;
  const directoryPath = nodePath.join(ctx.contentFolder, directory);

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
      resolveRelations: defaultResolve,
      media,
      markdownStats,
      cloud,
      readEntry,
    },
    getTree,
    getFlatTree,
    getEntries,
    getEntry,
    getAncestorNodes,
    getNextNode,
    getPreviousNode,
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
    const nodes = await walkTree({
      directoryPath,
      schema,
      extension,
      titleField,
      orderFileName: resolvedOrderFileName,
    });

    if (typeof slug == "undefined") return nodes;
    return findNode(nodes, slug, directory);
  }

  async function getFlatTree() {
    return flattenTree(await getTree());
  }

  async function readEntry(slug: Slug) {
    const meta = buildEntryMeta({
      directory: directoryPath,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const raw = await fs.readFile(meta.filePath, "utf-8");

    const entry = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
    };
    return (await resolveEntryMedia({
      entry: await addEntryStats({ entry, markdownStats }),
      media,
      mediaFolder: ctx.mediaFolder,
      filePath: meta.filePath,
    })) as ResolvedTreeEntry<S, Ext, TaggedRels, false>;
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
}
