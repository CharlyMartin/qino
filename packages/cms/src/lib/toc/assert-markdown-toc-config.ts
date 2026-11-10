import { MARKDOWN_HEADING_TAGS } from "../../data/globals";
import type { MarkdownTocOption } from "../../types/markdown-toc";

type AssertMarkdownTocConfigParams = {
  markdownToc: MarkdownTocOption;
  extension: string;
  primitiveId: string;
};

/**
 * Fails at definition on `markdownToc` for JSON files, which have no headings,
 * and on an `upTo` that isn't a heading tag.
 */
export function assertMarkdownTocConfig({
  markdownToc,
  extension,
  primitiveId,
}: AssertMarkdownTocConfigParams) {
  if (!markdownToc) return;

  if (extension == ".json") {
    throw new Error(
      `markdownToc of "${primitiveId}" lists the Markdown headings, but JSON files have none.`,
    );
  }

  const tags: readonly string[] = MARKDOWN_HEADING_TAGS;
  if (typeof markdownToc == "object" && !tags.includes(markdownToc.upTo)) {
    throw new Error(
      `markdownToc.upTo of "${primitiveId}" must be one of ${tags.join(", ")}, got ${JSON.stringify(markdownToc.upTo)}.`,
    );
  }
}
