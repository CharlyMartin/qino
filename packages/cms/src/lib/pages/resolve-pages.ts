import type { PagesConfig } from "../../types/pages";
import { describePagePathError } from "./describe-page-path-error";
import { titleFromDirectory } from "./title-from-directory";

type ResolvePagesParams = {
  pages: PagesConfig | undefined;
  siteUrl: string | undefined;
  /** Names the primitive in messages, such as `Collection "posts"`. */
  owner: string;
  /** The primitive's directory, which titles the index page by default. */
  directory: string;
};

/**
 * Checks `pages` when a primitive is defined, so a bad path fails before any
 * link, and returns them with the `siteUrl` they need and the index page's
 * title, on one line.
 */
export function resolvePages({
  pages,
  siteUrl,
  owner,
  directory,
}: ResolvePagesParams) {
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

  const title =
    pages.title?.replace(/\s+/g, " ").trim() || titleFromDirectory(directory);
  return { ...pages, title, siteUrl };
}
