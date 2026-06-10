import { QinoConfigMarker, QinoPrimitiveMarker } from "../../data";
import { assertDirectory } from "../../utils";
import { assertInstanceIdsMatch } from "./assert-instance-ids-match";
import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";
import { assertPrimitivesExistence } from "./assert-primitives-existence";
import { assertRelationInstanceIds } from "./assert-relation-instance-ids";
import { getEntryFilePath } from "./get-entry-file-path";
import { getRootDirPath } from "./get-root-dir-path";
import { loadQinoConfig } from "./load-qino-config";
import { loadQinoPrimitives } from "./load-qino-primitives";

// instead of throwing errors, use process.exit() with a nice error message formatted with
// https://github.com/unjs/consola
// Else?

export async function lint() {
  const rootDirPath = await getRootDirPath();
  const entryFilePath = getEntryFilePath(rootDirPath);

  const { collections, singletons, trees } =
    await loadQinoPrimitives(rootDirPath);

  const allPrimitives = [...collections, ...singletons, ...trees];

  // Ensure at least one primitive exists
  assertPrimitivesExistence(allPrimitives);

  // Ensure no two primitives own overlapping paths
  assertNoOverlappingPaths({
    collectionDirs: collections.map((c) => c[QinoPrimitiveMarker].directory),
    treeDirs: trees.map((t) => t[QinoPrimitiveMarker].directory),
    singletonFiles: singletons.map((s) => s[QinoPrimitiveMarker].file),
  });

  const qinoConfig = await loadQinoConfig(entryFilePath);

  const { instanceId, contentFolder, mediaFolder } =
    qinoConfig[QinoConfigMarker];

  // Ensure config paths exist and are directories
  await assertDirectory(contentFolder);
  await assertDirectory(mediaFolder);

  // Ensure all primitives belong to the same Qino instance
  assertInstanceIdsMatch(allPrimitives, instanceId);

  // Ensure all relation targets belong to the same Qino instance
  assertRelationInstanceIds(allPrimitives, instanceId);

  // TODO
  // [ ] Make sure that all the schemas validation pass
  // [ ] Ensure that the paths defined in the primitive config exist and are valid. Would calling getAll(), getTree(), etc do the job here? Maybe we should just use assertDirectory() and assertFile() instead, it's more linty.
  // [ ] Warn (not throw) if a collection or tree is empty.
  // [ ] Work on the images config and linting.

  console.log(
    "🎉🎉🎉",
    "\n",
    "Your Qino set up is all good. Congrats you legend! Enjoy your well-structured content!",
  );
}

// async function validateCollection(collection: AnyCollection) {
//   const entries = await collection.getAll({ resolveRelations: false });
//   if (entries.length == 0) {
//     const directory = collection[QinoPrimitiveMarker].directory;
//     throw new Error(
//       `Collection "${directory}" has no entries. A collection must have at least one entry.`,
//     );
//   }
// }

// async function validateSingleton(singleton: AnySingleton) {
//   try {
//     await singleton.getData({ resolveRelations: false });
//   } catch (cause) {
//     const file = singleton[QinoPrimitiveMarker].file as GenericPath;
//     const message = cause instanceof Error ? cause.message : String(cause);
//     throw new Error(`Singleton "${file}" failed validation: ${message}`, {
//       cause: cause instanceof Error ? cause : undefined,
//     });
//   }
// }

// async function validateTree(tree: AnyTree) {
//   const nodes = await tree.getTree();
//   if (countNodes(nodes) == 0) {
//     const directory = tree[QinoPrimitiveMarker].directory;
//     throw new Error(
//       `Tree "${directory}" has no entries. A tree must have at least one entry.`,
//     );
//   }
// }

// function countNodes(
//   nodes: ReadonlyArray<{ children: ReadonlyArray<unknown> }>,
// ) {
//   let count = 0;
//   for (const node of nodes) {
//     count +=
//       1 +
//       countNodes(
//         node.children as ReadonlyArray<{ children: ReadonlyArray<unknown> }>,
//       );
//   }
//   return count;
// }
