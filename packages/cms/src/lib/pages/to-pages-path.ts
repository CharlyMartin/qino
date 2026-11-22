import type { PagePatterns } from "../../types/pages";
import type { Slug } from "../../types/utils";
import { fillEntryPagePath } from "./fill-entry-page-path";

/** The path of the entry page for `slug`, or of the index page without one. */
export function toPagesPath({ index, entry }: PagePatterns, slug?: Slug) {
  return typeof slug == "undefined" ? index : fillEntryPagePath(entry, slug);
}
