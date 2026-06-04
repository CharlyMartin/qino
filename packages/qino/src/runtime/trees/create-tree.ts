import fs from "node:fs/promises";

import {
  DEFAULT_ORDER_FILE_NAME,
  META_FIELD_NAME,
  QinoMeta,
  QinoPrimitives,
} from "../../data";
import {
  buildEntryMeta,
  createRelationResolver,
  createResolveCache,
  validate,
} from "../../lib";
import { parseFile } from "../../lib/parse/parse-file";
import { normalizeDepth } from "../../lib/relations/normalize-depth";
import type {
  GenericPath,
  GetterOptions,
  NodeTree,
  ObjectSchema,
  Relations,
  ResolvedTreeEntry,
  ResolveOption,
  StringKeys,
  SupportedFileExtension,
  Tree,
} from "../../types";
import { findNode } from "./find-node";
import { resolveTreeDirectory } from "./resolve-tree-directory";
import { walkTree } from "./walk-tree";

type CreateTreeParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<Schema>,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  directory: GenericPath;
  schema: Schema;
  extension: Ext;
  titleField: Title;
  orderFileName?: string;
  relations?: Rels;
  resolveRelations?: DefaultR;
};

// I don't think createTree should allow JSON? TBD. Maybe it should.
export function createTree<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<S>,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = true,
>({
  directory,
  schema,
  extension,
  titleField,
  orderFileName,
  relations,
  resolveRelations,
}: CreateTreeParams<S, Ext, Title, Rels, DefaultR>) {
  const treeRelations = (relations ?? {}) as Rels;
  const defaultResolve = (resolveRelations ?? true) as ResolveOption;
  const resolvedOrderFileName = orderFileName ?? DEFAULT_ORDER_FILE_NAME;

  const tree = {
    [QinoMeta]: {
      is: QinoPrimitives.tree,
      schema,
      directory,
      extension,
      titleField,
      orderFileName: resolvedOrderFileName,
      relations: treeRelations,
      resolveRelations: defaultResolve,
    },
    getTree,
    getEntry,
  } as const satisfies Tree<S, Ext, Title, Rels, DefaultR>;

  return tree;

  async function getTree(): Promise<Array<NodeTree>>;
  async function getTree(slug: string): Promise<NodeTree>;
  async function getTree(slug?: string) {
    const directoryPath = await resolveTreeDirectory(directory);

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

  async function getEntry<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedTreeEntry<S, Ext, Rels, R>> {
    // what does abs mean here?
    const directoryPath = await resolveTreeDirectory(directory);

    const meta = buildEntryMeta({
      directory: directoryPath,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const raw = await fs.readFile(meta.filePath, "utf-8");

    // Maybe the returned entry should also two functions: getNext and getPrevious that would return the next and previous entries according to the order file?
    // Would that be hard to do?
    const validatedDataWithMeta = {
      [META_FIELD_NAME]: meta,
      ...parseFile({
        schema,
        data: raw,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
    };

    const resolveSetting = options?.resolveRelations ?? defaultResolve;

    if (resolveSetting === false) {
      return validatedDataWithMeta as ResolvedTreeEntry<S, Ext, Rels, R>;
    }

    const cache = createResolveCache();
    const resolver = createRelationResolver(cache);

    const depth = normalizeDepth(resolveSetting);

    const resolved = await resolver.resolveEntry(validatedDataWithMeta, {
      relations: tree[QinoMeta].relations,
      depth,
    });

    return resolved as ResolvedTreeEntry<S, Ext, Rels, R>;
  }
}
