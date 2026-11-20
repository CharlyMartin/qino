import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { rendersNothing } from "./renders-nothing";

type StartsWithH1Options = {
  mdx: boolean;
};

/**
 * Whether a Markdown body opens with an H1, after any blocks that render
 * nothing, such as MDX `import`s and comments.
 */
export function startsWithH1(body: string, { mdx }: StartsWithH1Options) {
  const first = parseMarkdownBody(body, {
    mdx,
  }).children.find((node) => !rendersNothing(node));
  return first?.type == "heading" && first.depth == 1;
}
