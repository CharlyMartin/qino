import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  DEFAULT_ORDER_FILE_NAME,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  augmentEntry,
  buildEntryMeta,
  createRelationResolver,
  createResolveCache,
  validate,
} from "../../lib";
import { parseFile } from "../../lib/parse/parse-file";
import { normalizeDepth } from "../../lib/relations/normalize-depth";
import type {
  AugmentOutput,
  GenericPath,
  GetterOptions,
  ObjectSchema,
  Relations,
  ResolvedTreeEntry,
  ResolveOption,
  StringKeys,
  SupportedFileExtension,
  Tree,
  TreeNode,
} from "../../types";
import type { EntryAugment } from "../../types/augment";
import type { TreeEntryMeta } from "../../types/entry";
import type { Slug } from "../../types/utils";
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
  DefaultR extends ResolveOption = true,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
> = {
  directory: Dir;
  schema: Schema;
  extension: Ext;
  titleField: Title;
  orderFileName?: string;
  relations?: Rels;
  resolveRelations?: DefaultR;
  augment?: EntryAugment<Schema, TreeEntryMeta<Ext>, Derived>;
};

export function createTree<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<S>,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
>(
  ctx: QinoContext,
  params: CreateTreeParams<S, Ext, Title, Rels, DefaultR, Dir, Derived>,
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
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;
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
    },
    getTree,
    getFlatTree,
    getEntry,
    getNextNode,
    getPreviousNode,
  } as const satisfies Tree<S, Ext, Title, Rels, DefaultR, Dir, Derived>;

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

  async function getEntry<R extends ResolveOption = DefaultR>(
    slug: Slug,
    options?: GetterOptions<R>,
  ): Promise<ResolvedTreeEntry<S, Ext, Rels, R, Derived>> {
    const meta = buildEntryMeta({
      directory: directoryPath,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const raw = await fs.readFile(meta.filePath, "utf-8");

    const validatedDataWithMeta = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
    };

    const augmentedEntry = await augmentEntry(validatedDataWithMeta, augment);

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return augmentedEntry as ResolvedTreeEntry<S, Ext, Rels, R, Derived>;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await resolver.resolveEntry(augmentedEntry, {
      relations: tree[QinoPrimitiveMarker].relations,
      depth,
      sourceInstanceId: ctx.instanceId,
    });

    return resolved as ResolvedTreeEntry<S, Ext, Rels, R, Derived>;
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
