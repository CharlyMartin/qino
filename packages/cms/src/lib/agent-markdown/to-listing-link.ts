import type { ListingLink } from "../../types/agent-markdown";
import { absolutizeLinks } from "./absolutize-links";
import { readEntryDescription } from "./read-entry-description";
import { type ReadEntryTitleParams, readEntryTitle } from "./read-entry-title";
import { toOneLine } from "./to-one-line";

type ToListingLinkParams = ReadEntryTitleParams & {
  /** The entry page's Markdown URL. */
  url: string;
};

/**
 * An entry's link in a listing, its title and description each on one line,
 * and the description's site-relative links made absolute.
 */
export function toListingLink({ url, ...title }: ToListingLinkParams) {
  // The Markdown URL is on `siteUrl`, so its origin is the site's.
  const description = absolutizeLinks(readEntryDescription(title.entry), {
    origin: new URL(url).origin,
    mdx: false,
  });
  return {
    title: readEntryTitle(title),
    url,
    description: toOneLine(description),
  } satisfies ListingLink;
}
