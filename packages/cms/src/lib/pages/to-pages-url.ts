import type { PagesConfig } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { toPageUrl } from "./to-page-url";
import { toPagesPath } from "./to-pages-path";

type SitePages = Pick<PagesConfig, "index" | "entry"> & { siteUrl: string };

/** The URL of the entry page for `slug`, or of the index page without one. */
export function toPagesUrl(pages: SitePages, slug?: Slug) {
  return toPageUrl(toPagesPath(pages, slug), pages.siteUrl);
}
