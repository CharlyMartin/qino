import type { ListingLink, ListingSection } from "../../types/page-markdown";
import { formatFrontmatterBlock } from "./format-frontmatter-block";
import { formatListingLink } from "./format-listing-link";
import { formatListingSection } from "./format-listing-section";

type BuildIndexPageMarkdownParams = {
  /** The index page's title. */
  title: string;
  /** Links listed under the title, as a collection's entries are. */
  links?: Array<ListingLink>;
  /** Sections after them, as a tree's root nodes are. */
  sections?: Array<ListingSection>;
  /** The index page's URL. With one, the document opens with a frontmatter block. */
  canonical?: string;
};

/**
 * An index page's Markdown: a frontmatter block when there's a
 * `canonical`, then `# {title}`, a line per link, and each section.
 */
export function buildIndexPageMarkdown({
  title,
  links = [],
  sections = [],
  canonical,
}: BuildIndexPageMarkdownParams) {
  const blocks = [];
  if (canonical) blocks.push(formatFrontmatterBlock({ title, canonical }));
  blocks.push(`# ${title}`);
  if (links.length > 0) blocks.push(links.map(formatListingLink).join("\n"));
  blocks.push(...sections.map(formatListingSection));
  return `${blocks.join("\n\n")}\n`;
}
