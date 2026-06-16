import type { GenericPath } from "../../types";
import { getCollisionFreeTypeName } from "./get-collision-free-type-name";
import type { GeneratedSlugEntry } from "./render-generated-types";

type Collected = {
  directory: GenericPath;
  slugs: string[];
};

export function generateTypeNames(collected: Array<Collected>) {
  const usedNames = new Set<string>();
  const entries: Array<GeneratedSlugEntry> = [];

  for (const { directory, slugs } of collected) {
    // Omit empties — fall back to `string` rather than emit `never`.
    if (slugs.length == 0) continue;

    const typeName = getCollisionFreeTypeName(directory, usedNames);
    entries.push({ directory, typeName, slugs });
  }

  return entries;
}
