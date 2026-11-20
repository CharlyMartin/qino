/** Returns a page's agent Markdown, or `null` when the page doesn't exist. */
export type LoadAgentMarkdown = () => string | null | Promise<string | null>;

/** A link in a listing, such as an index page's: one line each. */
export type ListingLink = {
  title: string;
  /** The absolute Markdown URL it points at. */
  url: string;
  /** Left out of the line when empty. */
  description: string;
};

/** A titled list of links, such as a tree's root node and its descendants. */
export type ListingSection = {
  title: string;
  links: Array<ListingLink>;
};
