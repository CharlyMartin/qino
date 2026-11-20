import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { compareCodeUnits } from "./compare-code-units";

type SortLlmsTxtPrimitivesParams = {
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

type TreeOrCollection = AnyCollection | AnyTree;

/**
 * The primitives in `llms.txt`'s order: the trees, then the collections, as
 * `treesAndCollections`, then the items. Each kind is in code-unit order of its directory
 * or file, since primitives are found by glob, so every build writes the same
 * files.
 */
export function sortLlmsTxtPrimitives({
  collections,
  items,
  trees,
}: SortLlmsTxtPrimitivesParams) {
  const byDirectory = (primitives: Array<TreeOrCollection>) =>
    primitives.toSorted((a, b) =>
      compareCodeUnits(
        a[QinoPrimitiveMarker].directory,
        b[QinoPrimitiveMarker].directory,
      ),
    );

  return {
    treesAndCollections: [...byDirectory(trees), ...byDirectory(collections)],
    items: items.toSorted((a, b) =>
      compareCodeUnits(
        a[QinoPrimitiveMarker].file,
        b[QinoPrimitiveMarker].file,
      ),
    ),
  };
}
