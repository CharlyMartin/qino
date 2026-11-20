import type { ListingLink } from "../../types/agent-markdown";

/**
 * A listing's line for a link, as llmstxt.org lists them:
 * `- [title](url): description`, without `: description` when it's empty.
 */
export function formatListingLink({ title, url, description }: ListingLink) {
  // An unbalanced bracket in the title would end the link text early.
  const text = title.replace(/[\\[\]]/g, "\\$&");
  return `- [${text}](${url})${description ? `: ${description}` : ""}`;
}
