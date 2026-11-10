import GithubSlugger from "github-slugger";

import type { MarkdownHeadingLevel } from "../../types/markdown-toc";
import { getHeadingText } from "./get-heading-text";
import { getMarkdownHeadings } from "./get-markdown-headings";
import { getRenderedFootnotes } from "./get-rendered-footnotes";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";
import { parseMarkdownBody } from "./parse-markdown-body";

type GetMarkdownTocParams = {
  body: string;
  upTo?: MarkdownHeadingLevel;
  /** Parses the body as MDX, for `.mdx` files. */
  mdx?: boolean;
};

/**
 * Lists the headings up to `upTo`, with the ids `rehype-slug` gives them. Every
 * heading is slugged, so duplicate suffixes match headings left out too.
 */
export function getMarkdownToc({
  body,
  upTo = 6,
  mdx = false,
}: GetMarkdownTocParams) {
  const slugger = new GithubSlugger();
  const tree = parseMarkdownBody(body, mdx);
  const footnotes = getRenderedFootnotes(tree);
  const footnoteOrder = footnotes.map(({ id }) => id);
  // Footnotes render after the body, so their headings are slugged last.
  const headings = [
    ...getMarkdownHeadings(tree),
    ...footnotes.flatMap(({ definition }) =>
      definition.children.flatMap(getMarkdownHeadings),
    ),
  ];

  return headings
    .map((node) => {
      const source = getHeadingText(node, footnoteOrder);

      return {
        heading: node.depth,
        id: slugger.slug(source),
        text: normalizeMarkdownProse(source),
      };
    })
    .filter(({ heading, text }) => heading <= upTo && text != "");
}
