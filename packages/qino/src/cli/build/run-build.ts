import { join, resolve } from "node:path";

import { ENTRY_FILE_NAME, QinoMeta, ROOT_FOLDER_NAME } from "../../data";
import type {
  AnyCollection,
  AnySingleton,
  AnyTree,
  GenericPath,
} from "../../types";
import { assertDirectory, assertFile } from "../../utils";
import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";
import { loadCollections } from "./load-collections";
import { loadSingletons } from "./load-singletons";
import { loadTrees } from "./load-trees";

export async function runBuild() {
  const cwd = process.cwd();

  const qinoDir = join(cwd, ROOT_FOLDER_NAME);
  await assertDirectory(
    qinoDir,
    `"${ROOT_FOLDER_NAME}" folder not found at "${qinoDir}"`,
  );

  const entryPath = join(qinoDir, ENTRY_FILE_NAME);
  await assertFile(
    entryPath,
    `"${ROOT_FOLDER_NAME}/${ENTRY_FILE_NAME}" not found at "${entryPath}". Create it and call createQino(...).`,
  );

  const collections = await loadCollections(qinoDir);
  const singletons = await loadSingletons(qinoDir);
  const trees = await loadTrees(qinoDir);

  const allPrimitives = [
    ...collections.values(),
    ...singletons.values(),
    ...trees.values(),
  ];

  if (allPrimitives.length == 0) {
    throw new Error(
      `No primitives found under "${ROOT_FOLDER_NAME}/". Define at least one collection, singleton, or tree.`,
    );
  }

  const instanceId = allPrimitives[0][QinoMeta].instanceId;

  // The double for loop code is not ideal -> Look at a cleaner way or extract it into a separate check.
  for (const primitive of allPrimitives) {
    if (primitive[QinoMeta].instanceId != instanceId) {
      throw new Error(
        `Multiple Qino instances detected. All primitives must come from a single createQino() call in "${ROOT_FOLDER_NAME}/${ENTRY_FILE_NAME}".`,
      );
    }

    for (const [field, decl] of Object.entries(primitive[QinoMeta].relations)) {
      if (!decl) continue;
      const target = typeof decl == "function" ? decl() : decl;
      if (target[QinoMeta].instanceId != instanceId) {
        throw new Error(
          `Relation "${field}" points to a primitive created by a different createQino() call. All related primitives must come from the same Qino instance.`,
        );
      }
    }
  }

  const { config } = allPrimitives[0][QinoMeta];
  const contentFolderAbs = resolve(cwd, config.contentFolder);
  await assertDirectory(
    contentFolderAbs,
    `contentFolder "${config.contentFolder}" is not a directory (resolved to ${contentFolderAbs})`,
  );

  const mediaFolderAbs = resolve(cwd, config.mediaFolder);
  await assertDirectory(
    mediaFolderAbs,
    `mediaFolder "${config.mediaFolder}" is not a directory (resolved to ${mediaFolderAbs})`,
  );

  assertNoOverlappingPaths({
    collectionDirs: [...collections.keys()],
    singletonFiles: [...singletons.keys()],
    treeDirs: [...trees.keys()],
  });

  await Promise.all([
    ...Array.from(collections.values(), validateCollection),
    ...Array.from(singletons.values(), validateSingleton),
    ...Array.from(trees.values(), validateTree),
  ]);

  console.log(
    `Validated ${collections.size} collection(s), ${singletons.size} singleton(s), ${trees.size} tree(s).`,
  );
}

async function validateCollection(collection: AnyCollection) {
  const entries = await collection.getAll({ resolveRelations: false });
  if (entries.length == 0) {
    const directory = collection[QinoMeta].directory;
    throw new Error(
      `Collection "${directory}" has no entries. A collection must have at least one entry.`,
    );
  }
}

async function validateSingleton(singleton: AnySingleton) {
  try {
    await singleton.getData({ resolveRelations: false });
  } catch (cause) {
    const file = singleton[QinoMeta].file as GenericPath;
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Singleton "${file}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}

async function validateTree(tree: AnyTree) {
  const nodes = await tree.getTree();
  if (countNodes(nodes) == 0) {
    const directory = tree[QinoMeta].directory;
    throw new Error(
      `Tree "${directory}" has no entries. A tree must have at least one entry.`,
    );
  }
}

function countNodes(
  nodes: ReadonlyArray<{ children: ReadonlyArray<unknown> }>,
) {
  let count = 0;
  for (const node of nodes) {
    count +=
      1 +
      countNodes(
        node.children as ReadonlyArray<{ children: ReadonlyArray<unknown> }>,
      );
  }
  return count;
}
