import type { Loaded } from "../load";
import { validateCollection } from "./validate-collection";
import { validateSingleton } from "./validate-singleton";
import { validateTree } from "./validate-tree";

export async function check({ collections, singletons, trees }: Loaded) {
  console.log("qino check starts...");

  await Promise.all([
    ...collections.map(validateCollection),
    ...singletons.map(validateSingleton),
    ...trees.map(validateTree),
  ]);

  console.log("🌈 SUCCESS:", "All content passes schema validation.");

  console.log("qino check done!");
}
