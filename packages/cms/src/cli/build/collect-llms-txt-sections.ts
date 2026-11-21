import { QinoPrimitiveMarker } from "../../data/globals";
import type { ListingSection } from "../../types/agent-markdown";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { compareCodeUnits } from "./compare-code-units";

type CollectLlmsTxtSectionsParams = {
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

type ListedPrimitive = AnyCollection | AnyTree;

/**
 * `llms.txt`'s link sections: the trees', then the collections', then the
 * items' shared `## Pages`. Each kind is in code-unit order of its directory
 * or file, since primitives are found by glob, so every build writes the same
 * file. Primitives without pages, and sections without links, are left out.
 */
export async function collectLlmsTxtSections({
  collections,
  items,
  trees,
}: CollectLlmsTxtSectionsParams) {
  const byDirectory = (primitives: Array<ListedPrimitive>) =>
    primitives.toSorted((a, b) =>
      compareCodeUnits(
        a[QinoPrimitiveMarker].directory,
        b[QinoPrimitiveMarker].directory,
      ),
    );

  const sections: Array<ListingSection> = [];
  for (const primitive of [
    ...byDirectory(trees),
    ...byDirectory(collections),
  ]) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (pages) sections.push(...(await pages.getListingSections()));
  }

  const links = [];
  const sortedItems = items.toSorted((a, b) =>
    compareCodeUnits(a[QinoPrimitiveMarker].file, b[QinoPrimitiveMarker].file),
  );
  for (const item of sortedItems) {
    const page = item[QinoPrimitiveMarker].page;
    if (page) links.push(await page.getListingLink());
  }
  if (links.length > 0) sections.push({ title: "Pages", links });

  return sections;
}
