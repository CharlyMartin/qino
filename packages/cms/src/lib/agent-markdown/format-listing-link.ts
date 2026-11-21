import type { ListingLink } from "../../types/agent-markdown";

/**
 * A listing's line for a link, as llmstxt.org lists them:
 * `- [title](url): description`, without `: description` when it's empty.
 */
export function formatListingLink({ title, url, description }: ListingLink) {
  // An unbalanced bracket in the title, or parenthesis in the URL, would end
  // the link early.
  const text = title.replace(/[\\[\]]/g, "\\$&");
  const destination = url.replaceAll("(", "%28").replaceAll(")", "%29");
  return `- [${text}](${destination})${description ? `: ${description}` : ""}`;
}
