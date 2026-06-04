import { join } from "node:path";

import { QinoMeta, ROOT_FOLDER_NAME, TREES_FOLDER_NAME } from "../../data";
import { walkTree } from "../../runtime/trees/walk-tree";
import type { AnyTree, NodeTree, SupportedFileExtension } from "../../types";
import { deriveRelations, type RelationLockEntry } from "./derive-relations";

type TreeLockEntry = {
  directory: string;
  extension: SupportedFileExtension;
  titleField: string;
  relations: Array<RelationLockEntry>;
};

export async function buildTreesLock(
  contentFolderAbs: string,
  registry: Map<string, AnyTree>,
) {
  const out: Record<string, TreeLockEntry> = {};

  for (const [treePath, tree] of registry.entries()) {
    const meta = tree[QinoMeta];
    const treeDir = join(contentFolderAbs, meta.directory);

    const nodes = await walkTree({
      directoryPath: treeDir,
      schema: meta.schema,
      extension: meta.extension,
      titleField: meta.titleField,
      orderFileName: meta.orderFileName,
    });

    if (countNodes(nodes) == 0) {
      throw new Error(
        `Tree "${treePath}" (directory: ${meta.directory}) has no entries. A tree must have at least one entry. Add files under ${ROOT_FOLDER_NAME}/${TREES_FOLDER_NAME} or remove the tree definition.`,
      );
    }

    out[treePath] = {
      directory: meta.directory,
      extension: meta.extension,
      titleField: meta.titleField,
      relations: deriveRelations(meta.relations),
    };
  }

  return out;
}

function countNodes(nodes: Array<NodeTree>): number {
  let count = 0;
  for (const node of nodes) {
    count += 1 + countNodes(node.children);
  }
  return count;
}
