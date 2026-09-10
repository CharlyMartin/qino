import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  DEFAULT_ORDER_FILE_NAME,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  applyView,
  buildEntryMeta,
  buildViews,
  parseFile,
  selectView,
  validate,
} from "../../lib";
import type {
  AugmentOutput,
  GenericPath,
  ObjectSchema,
  Relations,
  ResolveOption,
  StringKeys,
  SupportedFileExtension,
  Tree,
  TreeNode,
} from "../../types";
import type { EntryAugment } from "../../types/augment";
import type { TreeEntryMeta } from "../../types/entry";
import type { Slug } from "../../types/utils";
import type {
  ConfiguredViews,
  SelectedView,
  ViewArguments,
  ViewFactory,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import type { QinoContext } from "../qino/create-qino";
import { findNode } from "./find-node";
import { flattenTree } from "./flatten-tree";
import { getNeighborNode } from "./get-neighbor-node";
import { walkTree } from "./walk-tree";

export type CreateTreeParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<Schema>,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = false,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
  Views extends object = object,
> = {
  directory: Dir;
  schema: Schema;
  extension: Ext;
  titleField: Title;
  orderFileName?: string;
  relations?: Rels;
  resolveRelations?: DefaultR;
  augment?: EntryAugment<Schema, TreeEntryMeta<Ext>, Derived, Rels, DefaultR>;
  views?: ViewsConfig<Views, ViewFactory<Schema, TreeEntryMeta<Ext>, Rels>>;
};

export function createTree<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<S>,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = false,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
  const Views extends object = object,
>(
  ctx: QinoContext,
  params: CreateTreeParams<S, Ext, Title, Rels, DefaultR, Dir, Derived, Views>,
) {
  const {
    directory,
    schema,
    extension,
    titleField,
    orderFileName,
    relations,
    resolveRelations,
    augment,
  } = params;

  const treeRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? false) as ResolveOption;
  const views = buildViews(params.views, "tree");
  const defaults = { resolveRelations: defaultResolve, augment };
  const resolvedOrderFileName = orderFileName ?? DEFAULT_ORDER_FILE_NAME;
  const directoryPath = nodePath.join(ctx.contentFolder, directory);

  const tree = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.tree,
      instanceId: ctx.instanceId,
      schema,
      directory,
      extension,
      titleField,
      orderFileName: resolvedOrderFileName,
      relations: treeRelations,
      resolveRelations: defaultResolve,
      readEntry,
    },
    getTree,
    getFlatTree,
    getEntry,
    getNextNode,
    getPreviousNode,
  } as const satisfies Tree<
    S,
    Ext,
    Title,
    Rels,
    DefaultR,
    Dir,
    Derived,
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

    return {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
    };
  }

  async function getEntry<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(slug: Slug, ...[options]: Args) {
    const view = selectView(defaults, views, options);
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
      Rels,
      DefaultR,
      Derived,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
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
