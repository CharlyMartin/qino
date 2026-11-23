import { absolutizeLinks } from "../../lib/page-markdown/absolutize-links";
import { formatFrontmatterBlock } from "../../lib/page-markdown/format-frontmatter-block";
import { toOneLine } from "../../lib/page-markdown/to-one-line";
import { toAbsoluteUrl } from "../../lib/pages/to-absolute-url";
import { getHeadingText } from "../../utils/markdown/get-heading-text";
import { findLlmsTxtTemplateHead } from "./find-llms-txt-template-head";
import { parseLlmsTxtTemplate } from "./parse-llms-txt-template";

type BuildIndexMdParams = {
  /** The `llms.txt` template, as read. */
  template: string;
  /** The `llms.txt` built from it. */
  llmsTxt: string;
  /** The site's URL, the homepage's `canonical`. */
  siteUrl: string;
};

/**
 * `index.md`: a frontmatter block, then `llmsTxt`. The block's `title` is the
 * template's first H1, its `description` the summary blockquote after it, and
 * its `canonical` the homepage. Without an H1, qino has no title to give, so
 * it's `llmsTxt` alone.
 */
export function buildIndexMd({
  template,
  llmsTxt,
  siteUrl,
}: BuildIndexMdParams) {
  const { text, blocks } = parseLlmsTxtTemplate(template);
  const { h1, summary } = findLlmsTxtTemplateHead(blocks);
  const title = h1 && toOneLine(getHeadingText(h1, { includeJsx: false }));
  if (!title) return llmsTxt;

  // The summary as written, without its `>` markers, its links absolute as
  // an entry's description's are.
  const description = summary
    ? absolutizeLinks(
        text
          .slice(summary.position?.start.offset, summary.position?.end.offset)
          .replace(/^[ \t]*>[ \t]?/gm, ""),
        { origin: siteUrl, mdx: false },
      )
    : "";
  const block = formatFrontmatterBlock({
    title,
    description,
    canonical: toAbsoluteUrl("/", siteUrl),
  });
  return `${block}\n\n${llmsTxt}`;
}
