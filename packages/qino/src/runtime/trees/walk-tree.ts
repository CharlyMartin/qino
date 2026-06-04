import fs from "node:fs/promises";
import nodePath from "node:path";

import type {
  NodeTree,
  ObjectSchema,
  SupportedFileExtension,
} from "../../types";
import { buildTreeNode } from "./build-tree-node";
import { readOrderFile } from "./read-order-file";

// Rename absDirectory to absoluteDirectory.
type WalkTreeParams = {
  absDirectory: string;
  schema: ObjectSchema;
  extension: SupportedFileExtension;
  titleField: string;
  orderFileName: string;
};

export async function walkTree(params: WalkTreeParams) {
  return walkFolder(params, params.absDirectory, "");
}

async function walkFolder(
  params: WalkTreeParams,
  absFolder: string,
  relFromRoot: string,
) {
  const entries = await fs.readdir(absFolder, { withFileTypes: true });
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));

  const fileMap = new Map<string, string>();
  const folderMap = new Map<string, Array<NodeTree>>();

  for (const dirent of sorted) {
    if (dirent.isFile()) {
      if (dirent.name === params.orderFileName) continue;
      if (!dirent.name.endsWith(params.extension)) continue;
      const name = dirent.name.slice(0, -params.extension.length);
      fileMap.set(name, nodePath.join(absFolder, dirent.name));
    } else if (dirent.isDirectory()) {
      const childRel = relFromRoot
        ? `${relFromRoot}/${dirent.name}`
        : dirent.name;
      const childAbs = nodePath.join(absFolder, dirent.name);
      const children = await walkFolder(params, childAbs, childRel);
      folderMap.set(dirent.name, children);
    }
  }

  const candidates = new Map<string, NodeTree>();

  for (const [name, filePath] of fileMap) {
    const children = folderMap.get(name) ?? [];
    const slug = relFromRoot ? `${relFromRoot}/${name}` : name;
    const node = await buildTreeNode({
      schema: params.schema,
      extension: params.extension,
      titleField: params.titleField,
      filePath,
      slug,
      children,
    });
    candidates.set(name, node);
  }

  for (const [name, children] of folderMap) {
    if (fileMap.has(name)) continue;
    if (children.length === 0) continue;
    const folderRel = relFromRoot ? `${relFromRoot}/${name}` : name;
    throw new Error(
      `Tree: folder "${folderRel}" is missing its sibling file "${folderRel}${params.extension}".`,
    );
  }

  // Maybe readOrderFile should also order the files. So that we wouldn't have to return order.path for better error messages. It would all happen in the function.
  const order = await readOrderFile({
    folder: absFolder,
    fileName: params.orderFileName,
  });
  if (!order) return [...candidates.values()];

  const result: Array<NodeTree> = [];
  const seen = new Set<string>();

  for (const orderName of order.entries) {
    const node = candidates.get(orderName);
    if (!node) {
      throw new Error(
        `${order.path}: entry "${orderName}" does not exist on disk (no matching "${orderName}${params.extension}" or non-empty "${orderName}/" folder).`,
      );
    }
    result.push(node);
    seen.add(orderName);
  }
  for (const [name, node] of candidates) {
    if (!seen.has(name)) result.push(node);
  }

  return result;
}
