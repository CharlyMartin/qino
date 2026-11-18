import fs from "node:fs/promises";
import nodePath from "node:path";

import { unwrapSettled } from "../../lib/async/unwrap-settled";
import type { TreeNode } from "../../types/tree";
import type { SupportedFileExtension } from "../../types/utils";
import { buildNode, type ReadParsedFile } from "./build-node";
import { getOrderFromFile } from "./get-order-from-file";
import { getOrderedNodes } from "./get-ordered-nodes";

type WalkTreeParams = {
  directoryPath: string;
  readParsed: ReadParsedFile;
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

  // Subfolders, files, and the order file are read concurrently. Failures are
  // still thrown in the order a one-by-one walk hits them: subfolders, then
  // files, by name, then a missing sibling file, then the order file.
  const fileMap = new Map<string, string>();
  const folderWalks = new Map<string, Promise<Array<TreeNode>>>();

  for (const dirent of sorted) {
    if (dirent.isFile()) {
      if (dirent.name == params.orderFileName) continue;
      if (!dirent.name.endsWith(params.extension)) continue;
      const name = dirent.name.slice(0, -params.extension.length);
      fileMap.set(name, nodePath.join(absFolder, dirent.name));
    } else if (dirent.isDirectory()) {
      // A tree at the project root would otherwise walk dependencies and tooling folders.
      if (dirent.name == "node_modules" || dirent.name.startsWith("."))
        continue;
      const childRel = relFromRoot
        ? `${relFromRoot}/${dirent.name}`
        : dirent.name;
      const childAbs = nodePath.join(absFolder, dirent.name);
      folderWalks.set(
        dirent.name,
        walkFolder({ params, absFolder: childAbs, relFromRoot: childRel }),
      );
    }
  }

  const nodeBuilds = [...fileMap].map(
    async ([name, filePath]) =>
      [
        name,
        await buildNode({
          readParsed: params.readParsed,
          extension: params.extension,
          titleField: params.titleField,
          filePath,
          slug: relFromRoot ? `${relFromRoot}/${name}` : name,
          // A file with a sibling folder waits for that folder's walk only.
          children: (await folderWalks.get(name)) ?? [],
        }),
      ] as const,
  );
  const orderRead = getOrderFromFile({
    folder: absFolder,
    fileName: params.orderFileName,
    extension: params.extension,
  });

  const [walked, built, ordered] = await Promise.all([
    Promise.allSettled(
      [...folderWalks].map(async ([name, walk]) => [name, await walk] as const),
    ),
    Promise.allSettled(nodeBuilds),
    Promise.allSettled([orderRead]),
  ]);

  const folderMap = new Map(unwrapSettled(walked));
  const candidates = new Map<string, TreeNode>(unwrapSettled(built));

  for (const [name, children] of folderMap) {
    if (fileMap.has(name)) continue;
    if (children.length == 0) continue;
    const folderRel = relFromRoot ? `${relFromRoot}/${name}` : name;
    throw new Error(
      `Tree: folder "${folderRel}" is missing its sibling file "${folderRel}${params.extension}".`,
    );
  }

  const [order] = unwrapSettled(ordered);

  return getOrderedNodes({
    order,
    candidates,
  });
}
