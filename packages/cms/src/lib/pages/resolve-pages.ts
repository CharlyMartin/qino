import type { PagesConfig } from "../../types/pages";
import { toOneLine } from "../agent-markdown/to-one-line";
import { describePagePathError } from "./describe-page-path-error";

type ResolvePagesParams = {
  pages: PagesConfig | undefined;
  siteUrl: string | undefined;
  /** Names the primitive in messages, such as `Collection "posts"`. */
  owner: string;
};

/**
 * Checks `pages` when a primitive is defined, so a bad path or title fails
 * before any link, and returns them with the `siteUrl` they need and their
 * title on one line.
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

  // A JavaScript caller can leave the title out.
  const title = typeof pages.title == "string" ? toOneLine(pages.title) : "";
  if (!title) {
    throw new Error(
      `${owner}: pages.title must name the index page, such as "Blog".`,
    );
  }

  return { ...pages, title, siteUrl };
}
