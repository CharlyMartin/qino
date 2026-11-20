import type { ListingLink } from "../../types/agent-markdown";
import { readEntryDescription } from "./read-entry-description";
import { readEntryTitle } from "./read-entry-title";

type ToListingLinkParams = {
  entry: Record<string, unknown>;
  /** The field holding the title. Defaults to `"title"`. */
  titleField?: string;
  /** The title when the entry has none, such as its slug. */
  fallbackTitle: string;
  /** The entry page's Markdown URL. */
  url: string;
};

/** An entry's link in a listing, its title and description each on one line. */
export function toListingLink({
  entry,
  titleField,
  fallbackTitle,
  url,
}: ToListingLinkParams) {
  return {
    title: readEntryTitle({ entry, titleField, fallbackTitle }),
    url,
    description: readEntryDescription(entry).replace(/\s+/g, " "),
  } satisfies ListingLink;
}
