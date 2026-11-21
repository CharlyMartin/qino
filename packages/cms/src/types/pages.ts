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
