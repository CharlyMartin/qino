import type { Heading, RootContent } from "mdast";

import { rendersNothing } from "../../lib/page-markdown/renders-nothing";

/**
 * The `llms.txt` template's first top-level `h1`, and the `summary`: the
 * blockquote right after it, ignoring blocks that render nothing, such as
 * comments.
 */
export function findLlmsTxtTemplateHead(blocks: Array<RootContent>) {
  const shown = blocks.filter((node) => !rendersNothing(node));
  const h1Index = shown.findIndex(
    (node) => node.type == "heading" && node.depth == 1,
  );
  if (h1Index == -1) return { h1: undefined, summary: undefined };

  const next = shown[h1Index + 1];
  return {
    h1: shown[h1Index] as Heading,
    summary: next?.type == "blockquote" ? next : undefined,
  };
}
