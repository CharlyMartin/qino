/** Where a collection's or a tree's pages live on the site. qino links to them but never routes. */
export type PagesConfig = {
  /** The index page's path, such as `"/blog"`. */
  readonly index: `/${string}`;
  /** The entry page's path, with `{slug}` where the slug goes, such as `"/blog/{slug}"`. */
  readonly entry: `/${string}{slug}${string}`;
  /**
   * The index page's title, in its agent Markdown and its `llms.txt` section.
   * Defaults to the directory name in sentence case.
   */
  readonly title?: string;
  /** Whether `llms-full.txt` holds the entry pages. Defaults to `true`. */
  readonly llmsFull?: boolean;
};

/** Checked `pages`, with the site's origin their links resolve against. */
export type ResolvedPages = PagesConfig & {
  readonly siteUrl: string;
};
