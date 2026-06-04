import fs from "node:fs/promises";
import nodePath from "node:path";

import type {
  NodeTree,
  ObjectSchema,
  SupportedFileExtension,
} from "../../types";
import { buildTreeNode } from "./build-tree-node";
import { getOrderFromFile } from "./get-order-from-file";
import { getOrderedNodeTrees } from "./get-ordered-node-trees";

type WalkTreeParams = {
  directoryPath: string;
  schema: ObjectSchema;
  extension: SupportedFileExtension;
  titleField: string;
  orderFileName: string;
};

export async function walkTree(params: WalkTreeParams) {
  return walkFolder({
    params,
    absFolder: params.directoryPath,
    relFromRoot: "",
  });
}

type WalkFolderParams = {
  params: WalkTreeParams;
  absFolder: string;
  relFromRoot: string;
};

async function walkFolder({
  params,
  absFolder,
  relFromRoot,
}: WalkFolderParams) {
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
      const children = await walkFolder({
        params,
        absFolder: childAbs,
        relFromRoot: childRel,
      });
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

  const order = await getOrderFromFile({
    folder: absFolder,
    fileName: params.orderFileName,
    extension: params.extension,
  });

  return getOrderedNodeTrees({
    order,
    candidates,
  });
}
