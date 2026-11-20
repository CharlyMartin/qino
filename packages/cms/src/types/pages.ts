import type { ListingLink, ListingSection } from "./agent-markdown";

/** A page's path on the site, such as `"/about"`. */
export type PagePath = `/${string}`;

/** Where a collection's or a tree's pages live on the site. qino links to them but never routes. */
export type PagesConfig = {
  /** The index page's path, such as `"/blog"`. */
  readonly index: PagePath;
  /** The entry page's path, with `{slug}` where the slug goes, such as `"/blog/{slug}"`. */
  readonly entry: `/${string}{slug}${string}`;
  /**
   * The index page's title, such as `"Blog"`. It heads the index page's agent
   * Markdown, and a collection's `llms.txt` section.
   */
  readonly title: string;
  /** Whether `llms-full.txt` holds the entry pages. Defaults to `true`. */
  readonly llmsFull?: boolean;
};

/** `pages` once checked: the index page's title on one line, and the site's URL. */
export type ResolvedPages = PagesConfig & {
  readonly title: string;
  readonly siteUrl: string;
};

/** An item's `page` once checked, with the site's URL. */
export type ResolvedItemPage = {
  readonly page: PagePath;
  readonly siteUrl: string;
};

/** What `qino build` reads from a collection or a tree that declares pages. */
export type PagesMeta = ResolvedPages & {
  /** Its `llms.txt` sections. */
  readonly getListingSections: () => Promise<Array<ListingSection>>;
  /** Its entry pages' agent Markdown, in its sections' order, for `llms-full.txt`. */
  readonly getEntryAgentMarkdown: () => Promise<Array<string>>;
};

/** What `qino build` reads from an item that declares a page. */
export type PageMeta = ResolvedItemPage & {
  /** Its link in `llms.txt`'s `## Pages` section. */
  readonly getListingLink: () => Promise<ListingLink>;
  /** Its page's agent Markdown, for `llms-full.txt`. */
  readonly getAgentMarkdown: () => Promise<string>;
};
