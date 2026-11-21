import type { PagesConfig } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { fillEntryPagePath } from "./fill-entry-page-path";
import { toMarkdownUrl } from "./to-markdown-url";

type SitePages = Pick<PagesConfig, "index" | "entry"> & { siteUrl: string };

/** The Markdown URL of the entry page for `slug`, or of the index page without one. */
export function toPagesMarkdownUrl(
  { index, entry, siteUrl }: SitePages,
  slug?: Slug,
) {
  const path =
    typeof slug == "undefined" ? index : fillEntryPagePath(entry, slug);
  return toMarkdownUrl(path, siteUrl);
}
