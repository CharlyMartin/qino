import type { PagesConfig } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { toMarkdownUrl } from "./to-markdown-url";
import { toPagesPath } from "./to-pages-path";

type SitePages = Pick<PagesConfig, "index" | "entry"> & { siteUrl: string };

/** The Markdown URL of the entry page for `slug`, or of the index page without one. */
export function toPagesMarkdownUrl(pages: SitePages, slug?: Slug) {
  return toMarkdownUrl(toPagesPath(pages, slug), pages.siteUrl);
}
