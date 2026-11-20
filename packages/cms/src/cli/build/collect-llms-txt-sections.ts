import { QinoPrimitiveMarker } from "../../data/globals";
import type { ListingSection } from "../../types/agent-markdown";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
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
  const { listed, items } = sortLlmsTxtPrimitives(primitives);

  const sections: Array<ListingSection> = [];
  for (const primitive of listed) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (pages) sections.push(...(await pages.getListingSections()));
  }

  const links = [];
  for (const item of items) {
    const page = item[QinoPrimitiveMarker].page;
    if (page) links.push(await page.getListingLink());
  }
  if (links.length > 0) sections.push({ title: "Pages", links });

  return sections;
}
