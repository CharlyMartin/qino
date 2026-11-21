import type { ResolvedPages } from "../../types/pages";

/** Returns a primitive's resolved `pages`, or throws when it declares none. */
export function requirePages(pages: ResolvedPages | undefined, owner: string) {
  if (!pages) {
    throw new Error(
      `${owner} has no pages: declare them to get agent Markdown and Markdown URLs.`,
    );
  }
  return pages;
}
