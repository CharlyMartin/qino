import type { PagesConfig } from "../../types/pages";
import { describePagePathError } from "./describe-page-path-error";

type ResolvePagesParams = {
  pages: PagesConfig | undefined;
  siteUrl: string | undefined;
  /** Names the primitive in messages, such as `Collection "posts"`. */
  owner: string;
};

/**
 * Checks `pages` when a primitive is defined, so a bad path fails before any
 * link, and returns them with the `siteUrl` they need.
 */
export function resolvePages({ pages, siteUrl, owner }: ResolvePagesParams) {
  if (!pages) return undefined;
  if (!siteUrl) {
    throw new Error(
      `${owner} declares pages, so initQino needs a siteUrl, such as "https://example.com".`,
    );
  }

  const error =
    describePagePathError(pages.index, {
      label: "pages.index",
      takesSlug: false,
    }) ??
    describePagePathError(pages.entry, {
      label: "pages.entry",
      takesSlug: true,
    });
  if (error) throw new Error(`${owner}: ${error}`);

  return { ...pages, siteUrl };
}
