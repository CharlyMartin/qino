import pluralize from "pluralize";

import { QinoPrimitiveMarker } from "../../data";
import { assertDirectory } from "../../utils";
import type { Loaded } from "../load";
import { assertInstanceIdsMatch } from "./assert-instance-ids-match";
import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";
import { assertPrimitivesExistence } from "./assert-primitives-existence";
import { assertRelationInstanceIds } from "./assert-relation-instance-ids";

// instead of throwing errors, use process.exit() with a nice error message formatted with
// https://github.com/unjs/consola

export async function lint({
  entryFilePath,
  collections,
  singletons,
  trees,
  context,
}: Loaded) {
  console.log("qino lint starts...");

  // 1. Finds the entry file path
  console.info("🌈 SUCCESS:", `entry file found at ${entryFilePath}`);

  // 2. Ensure user-defined paths exist and are directories
  await assertDirectory(context.contentFolder);
  console.info(
    "🌈 SUCCESS:",
    `content folder found at ${context.contentFolder}`,
  );

  await assertDirectory(context.mediaFolder);
  console.info("🌈 SUCCESS:", `media folder found at ${context.mediaFolder}`);

  const allPrimitives = [...collections, ...trees, ...singletons];

  // Ensure at least one primitive exists
  assertPrimitivesExistence(allPrimitives);

  // Ensure no two primitives own overlapping paths
  assertNoOverlappingPaths({
    collectionDirs: collections.map((c) => c[QinoPrimitiveMarker].directory),
    treeDirs: trees.map((t) => t[QinoPrimitiveMarker].directory),
    singletonFiles: singletons.map((s) => s[QinoPrimitiveMarker].file),
  });

  // Ensure all primitives belong to the same Qino instance
  assertInstanceIdsMatch(allPrimitives, context.instanceId);

  // Ensure all relation targets belong to the same Qino instance
  assertRelationInstanceIds(allPrimitives, context.instanceId);

  if (collections.length) {
    console.info(
      "🌈 SUCCESS:",
      `found ${collections.length} ${pluralize("collection", collections.length)}`,
    );

    for (const collection of collections) {
      console.info(`  - ${collection[QinoPrimitiveMarker].directory}`);
    }
  }

  if (trees.length) {
    console.info(
      "🌈 SUCCESS:",
      `found ${trees.length} ${pluralize("tree", trees.length)}`,
    );

    for (const tree of trees) {
      console.info(`  - ${tree[QinoPrimitiveMarker].directory}`);
    }
  }

  if (singletons.length) {
    console.info(
      "🌈 SUCCESS:",
      `found ${singletons.length} ${pluralize("singleton", singletons.length)}`,
    );

    for (const singleton of singletons) {
      console.info(`  - ${singleton[QinoPrimitiveMarker].file}`);
    }
  }

  console.log("qino lint done!");
}
