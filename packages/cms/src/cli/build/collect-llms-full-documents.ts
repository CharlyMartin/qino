import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { sortLlmsTxtPrimitives } from "./sort-llms-txt-primitives";

type CollectLlmsFullDocumentsParams = {
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

/**
 * `llms-full.txt`'s documents: the page Markdown of every entry page that
 * `llms.txt`'s link sections list, in their order, even when `llms.txt` links
 * to section llms.txt files instead. A primitive with `pages.llmsFull: false`
 * is left out unread.
 */
export async function collectLlmsFullDocuments(
  primitives: CollectLlmsFullDocumentsParams,
) {
  const { treesAndCollections, items } = sortLlmsTxtPrimitives(primitives);

  const documents = [];
  for (const primitive of treesAndCollections) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (pages && pages.llmsFull != false) {
      documents.push(...(await pages.getLlmsFullDocuments()));
    }
  }
  for (const item of items) {
    const page = item[QinoPrimitiveMarker].page;
    if (page) documents.push(await page.getLlmsFullDocument());
  }

  return documents;
}
