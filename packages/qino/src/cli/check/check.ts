import { consola } from "consola";

import type { Loaded } from "../load/load";
import { validateCollection } from "./validate-collection";
import { validateItem } from "./validate-item";
import { validateTree } from "./validate-tree";

export async function check({ collections, items, trees }: Loaded) {
  await Promise.all([
    ...collections.map(validateCollection),
    ...items.map(validateItem),
    ...trees.map(validateTree),
  ]);

  consola.success("All content passes schema validation.");
}
