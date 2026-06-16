import { consola } from "consola";

import type { Loaded } from "../load";
import { validateCollection } from "./validate-collection";
import { validateSingleton } from "./validate-singleton";
import { validateTree } from "./validate-tree";

export async function check({ collections, singletons, trees }: Loaded) {
  consola.start("qino check");

  await Promise.all([
    ...collections.map(validateCollection),
    ...singletons.map(validateSingleton),
    ...trees.map(validateTree),
  ]);

  consola.success("All content passes schema validation.");

  consola.success("qino check done");
}
