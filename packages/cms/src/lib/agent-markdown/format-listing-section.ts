import type { ListingSection } from "../../types/agent-markdown";
import { formatListingLink } from "./format-listing-link";

/** A section of a listing: `## {title}`, then a line per link. */
export function formatListingSection({ title, links }: ListingSection) {
  return [`## ${title}`, links.map(formatListingLink).join("\n")].join("\n\n");
}
