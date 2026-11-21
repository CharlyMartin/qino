import type { ListingLink, ListingSection } from "../../types/agent-markdown";
import { formatListingLink } from "./format-listing-link";
import { formatListingSection } from "./format-listing-section";

type BuildIndexAgentMarkdownParams = {
  /** The index page's title. */
  title: string;
  /** Links listed under the title, as a collection's entries are. */
  links?: Array<ListingLink>;
  /** Sections after them, as a tree's root nodes are. */
  sections?: Array<ListingSection>;
};

/**
 * An index page's agent Markdown: `# {title}`, then a line per link, then
 * each section.
 */
export function buildIndexAgentMarkdown({
  title,
  links = [],
  sections = [],
}: BuildIndexAgentMarkdownParams) {
  const blocks = [`# ${title}`];
  if (links.length > 0) blocks.push(links.map(formatListingLink).join("\n"));
  blocks.push(...sections.map(formatListingSection));
  return `${blocks.join("\n\n")}\n`;
}
