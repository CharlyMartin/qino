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
 * `llms-full.txt`'s documents: the agent Markdown of every entry page that
 * `llms.txt` links to, in its order. A primitive with `pages.llmsFull: false`
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
      documents.push(...(await pages.getEntryPagesAgentMarkdown()));
    }
  }
  for (const item of items) {
    const page = item[QinoPrimitiveMarker].page;
    if (page) documents.push(await page.getPageAgentMarkdown());
  }

  return documents;
}
