import type { PagesConfig } from "../../types/pages";
import { findPagePathError } from "./find-page-path-error";

type AssertPagesParams = {
  pages: PagesConfig | undefined;
  siteUrl: string | undefined;
  /** Names the primitive in messages, such as `Collection "posts"`. */
  owner: string;
};

/** Checks `pages` when a primitive is defined, so a bad path fails before any link. */
export function assertPages({ pages, siteUrl, owner }: AssertPagesParams) {
  if (!pages) return;
  if (!siteUrl) {
    throw new Error(
      `${owner} declares pages, so initQino needs a siteUrl, such as "https://example.com".`,
    );
  }

  const error =
    findPagePathError(pages.index, {
      label: "pages.index",
      takesSlug: false,
    }) ??
    findPagePathError(pages.entry, { label: "pages.entry", takesSlug: true });
  if (error) throw new Error(`${owner}: ${error}`);
}
