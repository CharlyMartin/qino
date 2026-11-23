import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyItem } from "../../types/item";
import { sortLlmsTxtPrimitives } from "./sort-llms-txt-primitives";

type CollectPagesSectionParams = {
  items: Array<AnyItem>;
};

/**
 * `llms.txt`'s `## Pages` section: a link per item that declares a page, in
 * file order, or none.
 */
export async function collectPagesSection({
  items,
}: CollectPagesSectionParams) {
  const links = [];
  for (const item of sortLlmsTxtPrimitives({ items }).items) {
    const page = item[QinoPrimitiveMarker].page;
    if (page) links.push(await page.getListingLink());
  }
  return links.length > 0 ? { title: "Pages", links } : undefined;
}
