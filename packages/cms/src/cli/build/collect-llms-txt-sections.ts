import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { ListingSection } from "../../types/page-markdown";
import type { AnyTree } from "../../types/tree";
import { collectPagesSection } from "./collect-pages-section";
import { sortLlmsTxtPrimitives } from "./sort-llms-txt-primitives";

type CollectLlmsTxtSectionsParams = {
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

/**
 * `llms.txt`'s link sections: the trees', then the collections', then the
 * items' shared `## Pages`, in `sortLlmsTxtPrimitives`' order. Primitives
 * without pages, and sections without links, are left out.
 */
export async function collectLlmsTxtSections(
  primitives: CollectLlmsTxtSectionsParams,
) {
  const { treesAndCollections } = sortLlmsTxtPrimitives(primitives);

  const sections: Array<ListingSection> = [];
  for (const primitive of treesAndCollections) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (pages) sections.push(...(await pages.getListingSections()));
  }

  const pagesSection = await collectPagesSection(primitives);
  if (pagesSection) sections.push(pagesSection);

  return sections;
}
