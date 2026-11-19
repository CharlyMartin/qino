import type { PagesConfig } from "../../types/pages";

/** Returns `pages`, or throws when the primitive declares none. */
export function requirePages(pages: PagesConfig | undefined, owner: string) {
  if (!pages) {
    throw new Error(
      `${owner} has no pages: declare them to get agent Markdown and Markdown URLs.`,
    );
  }
  return pages;
}
