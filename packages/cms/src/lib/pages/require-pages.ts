import type { PagesConfig } from "../../types/pages";

type RequirePagesParams = {
  pages: PagesConfig | undefined;
  siteUrl: string | undefined;
  /** Names the primitive in the message, such as `Collection "posts"`. */
  owner: string;
};

/** Returns `pages` with the `siteUrl` they need, or throws when the primitive declares none. */
export function requirePages({ pages, siteUrl, owner }: RequirePagesParams) {
  // `assertPages` already rejected pages without a siteUrl.
  if (!pages || !siteUrl) {
    throw new Error(
      `${owner} has no pages: declare them to get agent Markdown and Markdown URLs.`,
    );
  }
  return { ...pages, siteUrl };
}
