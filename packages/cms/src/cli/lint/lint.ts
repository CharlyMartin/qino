import path from "node:path";

import { consola } from "consola";
import pluralize from "pluralize";

import { QinoPrimitiveMarker } from "../../data/globals";
import { assertDirectory } from "../../lib/fs/assert-directory";
import type { Loaded } from "../load/load";
import { assertInstanceIdsMatch } from "./assert-instance-ids-match";
import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";
import { assertPrimitivesExistence } from "./assert-primitives-existence";
import { assertRelationInstanceIds } from "./assert-relation-instance-ids";

export async function lint({
  entryFilePath,
  collections,
  items,
  trees,
  context,
}: Loaded) {
  consola.success(`entry file found at "${entryFilePath}"`);

  // Ensure user-defined paths exist and are directories
  await assertDirectory(context.contentFolder);
  consola.success(
    `content folder found at "${path.join(process.cwd(), context.contentFolder)}"`,
  );

  await assertDirectory(context.mediaFolder);
  consola.success(
    `media folder found at "${path.join(process.cwd(), context.mediaFolder)}"`,
  );

  const allPrimitives = [...collections, ...trees, ...items];

  // Ensure at least one primitive exists
  assertPrimitivesExistence(allPrimitives);

  // Ensure no two primitives own overlapping paths
  assertNoOverlappingPaths({
    collectionDirs: collections.map((c) => c[QinoPrimitiveMarker].directory),
    treeDirs: trees.map((t) => t[QinoPrimitiveMarker].directory),
    itemFiles: items.map((s) => s[QinoPrimitiveMarker].file),
  });

  // Ensure all primitives belong to the same Qino instance
  assertInstanceIdsMatch(allPrimitives, context.instanceId);

  // Ensure all relation targets belong to the same Qino instance
  assertRelationInstanceIds(allPrimitives, context.instanceId);

  if (collections.length) {
    consola.success(
      `found ${collections.length} ${pluralize("collection", collections.length)}`,
    );

    for (const collection of collections) {
      consola.log(`  - ${collection[QinoPrimitiveMarker].directory}`);
    }
  }

  if (trees.length) {
    consola.success(`found ${trees.length} ${pluralize("tree", trees.length)}`);

    for (const tree of trees) {
      consola.log(`  - ${tree[QinoPrimitiveMarker].directory}`);
    }
  }

  if (items.length) {
    consola.success(`found ${items.length} ${pluralize("item", items.length)}`);

    for (const item of items) {
      consola.log(`  - ${item[QinoPrimitiveMarker].file}`);
    }
  }
}
