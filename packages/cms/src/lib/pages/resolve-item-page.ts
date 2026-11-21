import type { PagePath, ResolvedItemPage } from "../../types/pages";
import { describePagePathError } from "./describe-page-path-error";

type ResolveItemPageParams = {
  page: PagePath | undefined;
  siteUrl: string | undefined;
  /** Names the item in messages, such as `Item "about.md"`. */
  owner: string;
};

/**
 * Checks an item's `page` when the item is defined, so a bad path fails
 * before any link, and returns it with the `siteUrl` it needs.
 */
export function resolveItemPage({
  page,
  siteUrl,
  owner,
}: ResolveItemPageParams) {
  // `""` is a page too, and fails the path check below.
  if (page == undefined) return undefined;
  if (!siteUrl) {
    throw new Error(
      `${owner} declares a page, so initQino needs a siteUrl, such as "https://example.com".`,
    );
  }

  const error = describePagePathError(page, {
    label: "page",
    takesSlug: false,
  });
  if (error) throw new Error(`${owner}: ${error}`);

  return { page, siteUrl } satisfies ResolvedItemPage;
}
