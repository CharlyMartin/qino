import GithubSlugger from "github-slugger";

import type { MarkdownHeadingLevel } from "../../types/markdown-toc";
import { getHeadingId } from "./get-heading-id";
import { getHeadingText } from "./get-heading-text";
import { getMarkdownHeadings } from "./get-markdown-headings";
import { getRenderedFootnotes } from "./get-rendered-footnotes";
import { getUniqueId } from "./get-unique-id";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";
import { parseMarkdownBody } from "./parse-markdown-body";

type GetMarkdownTocParams = {
  body: string;
  upTo?: MarkdownHeadingLevel;
  /** Parses the body as MDX, for `.mdx` files. */
  mdx?: boolean;
  /** Turns `text` into an id, instead of slugging like `rehype-slug`. */
  slug?: (text: string) => string;
};

/**
 * Lists the headings up to `upTo`. Ids come from `{#id}`, then from `slug`,
 * else they're the ones `rehype-slug` gives: then every heading is slugged,
 * so duplicate suffixes match headings left out too.
 */
export function getMarkdownToc({
  body,
  upTo = 6,
  mdx = false,
  slug,
}: GetMarkdownTocParams) {
  const slugger = new GithubSlugger();
  const usedIds = new Set<string>();
  const tree = parseMarkdownBody(body, { mdx, headingIds: true });
  const footnotes = getRenderedFootnotes(tree);
  const footnoteOrder = footnotes.map(({ id }) => id);
  // Footnotes render after the body, so their headings are slugged last.
  const headings = [
    ...getMarkdownHeadings(tree),
    ...footnotes.flatMap(({ definition }) =>
      definition.children.flatMap(getMarkdownHeadings),
    ),
  ];

  return headings.flatMap((node) => {
    const text = normalizeMarkdownProse(
      getHeadingText(node, { footnoteOrder, includeJsx: false }),
    );
    const listed = node.depth <= upTo && text != "";
    // A custom `slug` pairs with a renderer that only names listed headings,
    // so the others don't count toward duplicates, `{#id}` included.
    if (slug && !listed) return [];

    let id = getHeadingId(node);
    if (id == null && slug) {
      id = getUniqueId(slug(text), usedIds);
    } else if (id == null) {
      // `rehype-slug` slugs every heading without an id, listed or not.
      id = slugger.slug(
        getHeadingText(node, { footnoteOrder, includeJsx: true }),
      );
    }
    usedIds.add(id);

    return listed ? [{ heading: node.depth, id, text }] : [];
  });
}
