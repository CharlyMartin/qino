import type { SitePages } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { toMarkdownUrl } from "./to-markdown-url";
import { toPagesPath } from "./to-pages-path";

/** The Markdown URL of the entry page for `slug`, or of the index page without one. */
export function toPagesMarkdownUrl(pages: SitePages, slug?: Slug) {
  return toMarkdownUrl(toPagesPath(pages, slug), pages.siteUrl);
}
