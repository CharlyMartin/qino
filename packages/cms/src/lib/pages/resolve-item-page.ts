import type {
  ItemPageConfig,
  PagePath,
  ResolvedItemPage,
} from "../../types/pages";
import { describePagePathError } from "./describe-page-path-error";

type ResolveItemPageParams = {
  /** The page's path, or an object holding it. */
  page: PagePath | ItemPageConfig | undefined;
  siteUrl: string | undefined;
  /** Names the item in messages, such as `Item "about.md"`. */
  owner: string;
};

/**
 * Checks an item's `page` when the item is defined, so a bad path fails
 * before any link, and returns its path with the `siteUrl` it needs.
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

  // Both forms are checked, and named in messages, as `page`.
  const path = typeof page == "object" ? page.path : page;
  const error = describePagePathError(path, {
    label: "page",
    takesSlug: false,
  });
  if (error) throw new Error(`${owner}: ${error}`);

  return { page: path, siteUrl } satisfies ResolvedItemPage;
}
