import type { SitePages } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { toAbsoluteUrl } from "./to-absolute-url";
import { toPagesPath } from "./to-pages-path";

/** The URL of the entry page for `slug`, or of the index page without one. */
export function toPagesUrl(pages: SitePages, slug?: Slug) {
  return toAbsoluteUrl(toPagesPath(pages, slug), pages.siteUrl);
}
