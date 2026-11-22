import type { PagesConfig } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { fillEntryPagePath } from "./fill-entry-page-path";

type PagePaths = Pick<PagesConfig, "index" | "entry">;

/** The path of the entry page for `slug`, or of the index page without one. */
export function toPagesPath({ index, entry }: PagePaths, slug?: Slug) {
  return typeof slug == "undefined" ? index : fillEntryPagePath(entry, slug);
}
