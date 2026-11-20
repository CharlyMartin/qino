import type { ListingLink } from "../../types/agent-markdown";
import { readEntryDescription } from "./read-entry-description";
import { type ReadEntryTitleParams, readEntryTitle } from "./read-entry-title";
import { toOneLine } from "./to-one-line";

type ToListingLinkParams = ReadEntryTitleParams & {
  /** The entry page's Markdown URL. */
  url: string;
};

/** An entry's link in a listing, its title and description each on one line. */
export function toListingLink({ url, ...title }: ToListingLinkParams) {
  return {
    title: readEntryTitle(title),
    url,
    description: toOneLine(readEntryDescription(title.entry)),
  } satisfies ListingLink;
}
