import { consola } from "consola";

import type { Loaded } from "../load/load";
import { assertMediaExists } from "./assert-media-exists";
import { validateCollection } from "./validate-collection";
import { validateItem } from "./validate-item";
import { validateTree } from "./validate-tree";

export async function check({ collections, items, trees, context }: Loaded) {
  await Promise.all([
    ...collections.map(validateCollection),
    ...items.map(validateItem),
    ...trees.map(validateTree),
  ]);

  consola.success("All content passes schema validation.");

  if (context.media.checkReferences == false) {
    consola.info("Media check skipped: `media.checkReferences` is false.");
    return;
  }

  await assertMediaExists(context);

  consola.success("All local media files exist.");
}
