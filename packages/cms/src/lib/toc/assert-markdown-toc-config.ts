import { MARKDOWN_HEADING_TAGS } from "../../data/globals";
import type { MarkdownTocOption } from "../../types/markdown-toc";

type AssertMarkdownTocConfigParams = {
  markdownToc: MarkdownTocOption;
  extension: string;
  primitiveId: string;
};

/**
 * Fails at definition on `markdownToc` for JSON files, which have no headings,
 * on an `upTo` that isn't a heading tag, and on a `slug` that isn't a function.
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

  if (typeof markdownToc != "object") return;
  const { upTo, slug } = markdownToc;

  const tags: readonly (string | undefined)[] = [
    ...MARKDOWN_HEADING_TAGS,
    undefined,
  ];
  if (!tags.includes(upTo)) {
    throw new Error(
      `markdownToc.upTo of "${primitiveId}" must be one of ${MARKDOWN_HEADING_TAGS.join(", ")}, got ${JSON.stringify(upTo)}.`,
    );
  }

  if (slug != null && typeof slug != "function") {
    throw new Error(
      `markdownToc.slug of "${primitiveId}" must be a function, got ${typeof slug}.`,
    );
  }
}
