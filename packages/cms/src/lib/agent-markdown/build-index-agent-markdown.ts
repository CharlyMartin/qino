import type { ListingLink, ListingSection } from "../../types/agent-markdown";
import { formatAgentFrontmatter } from "./format-agent-frontmatter";
import { formatListingLink } from "./format-listing-link";
import { formatListingSection } from "./format-listing-section";

type BuildIndexAgentMarkdownParams = {
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
 * An index page's agent Markdown: a frontmatter block when there's a
 * `canonical`, then `# {title}`, a line per link, and each section.
 */
export function buildIndexAgentMarkdown({
  title,
  links = [],
  sections = [],
  canonical,
}: BuildIndexAgentMarkdownParams) {
  const blocks = [`# ${title}`];
  if (canonical) blocks.unshift(formatAgentFrontmatter({ title, canonical }));
  if (links.length > 0) blocks.push(links.map(formatListingLink).join("\n"));
  blocks.push(...sections.map(formatListingSection));
  return `${blocks.join("\n\n")}\n`;
}
