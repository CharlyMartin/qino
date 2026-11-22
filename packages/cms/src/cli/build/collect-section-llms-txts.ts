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
 * `llms.txt`'s order: its `content`, the `path` it's served at, under its
 * index page, and its `link` in `llms.txt`. Throws for an index page at `/`,
 * whose section llms.txt would replace `llms.txt`, and for two primitives
 * whose section llms.txt would be the same file.
 */
export async function collectSectionLlmsTxts({
  collections,
  trees,
}: CollectSectionLlmsTxtsParams) {
  const { treesAndCollections } = sortLlmsTxtPrimitives({ collections, trees });

  const owners = new Map<string, string>();
  const sectionLlmsTxts = [];
  for (const primitive of treesAndCollections) {
    const pages = primitive[QinoPrimitiveMarker].pages;
    if (!pages) continue;
    if (pages.index == "/") {
      throw new Error(
        `${pages.owner}: pages.index is "/", so its section llms.txt would replace llms.txt. Give the index page another path, or turn off \`cli.build.llmsTxt.sections\`.`,
      );
    }

    const path = `${pages.index.replace(/\/$/, "")}/${LLMS_TXT_FILE_NAME}`;
    const owner = owners.get(path);
    if (owner) {
      throw new Error(
        `${owner} and ${pages.owner} would both write the section llms.txt "${path}". Give one another index page, or turn off \`cli.build.llmsTxt.sections\`.`,
      );
    }
    owners.set(path, pages.owner);

    sectionLlmsTxts.push({
      content: await pages.getSectionLlmsTxt(),
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
