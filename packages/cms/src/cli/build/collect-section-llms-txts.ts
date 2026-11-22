import { LLMS_TXT_FILE_NAME, QinoPrimitiveMarker } from "../../data/globals";
import { toAbsoluteUrl } from "../../lib/pages/to-absolute-url";
import type { AnyCollection } from "../../types/collection";
import type { AnyTree } from "../../types/tree";
import { sortLlmsTxtPrimitives } from "./sort-llms-txt-primitives";

type CollectSectionLlmsTxtsParams = {
  collections: Array<AnyCollection>;
  trees: Array<AnyTree>;
};

/**
 * The section llms.txt of each tree and collection that declares pages, in
 * `llms.txt`'s order: its `content`, the `path` it's served at, at its index
 * page's path, and its `link` in `llms.txt`. One with nothing to list has
 * none, as it has no `llms.txt` section. Throws for an index page at `/`,
 * whose section llms.txt would replace `llms.txt`.
 */
export async function collectSectionLlmsTxts({
  collections,
  trees,
}: CollectSectionLlmsTxtsParams) {
  const { treesAndCollections } = sortLlmsTxtPrimitives({
    collections,
    items: [],
    trees,
  });

  const sectionLlmsTxts = [];
  for (const primitive of treesAndCollections) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (!pages) continue;
    if (pages.index == "/") {
      throw new Error(
        `${pages.owner}: pages.index is "/", so its section llms.txt would replace llms.txt. Give the index page another path, or turn off \`cli.build.llmsTxt.sections\`.`,
      );
    }

    const content = await pages.getSectionLlmsTxt();
    if (content == null) continue;
    const path = `${pages.index.replace(/\/$/, "")}/${LLMS_TXT_FILE_NAME}`;
    sectionLlmsTxts.push({
      content,
      path,
      link: {
        title: pages.title,
        url: toAbsoluteUrl(path, pages.siteUrl),
        description: "",
      },
    });
  }
  return sectionLlmsTxts;
}
