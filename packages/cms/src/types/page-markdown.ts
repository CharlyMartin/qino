import type { Nodes } from "mdast";

import type { Awaitable } from "./augment";
import type { CheckMarkdownConfig } from "./markdown-config";

/** Returns a page's Markdown, or `null` when the page doesn't exist. */
export type LoadPageMarkdown = () => string | null | Promise<string | null>;

/** A link in a listing, such as an index page's: one line each. */
export type ListingLink = {
  title: string;
  /** The absolute URL it points at, such as a page's Markdown URL. */
  url: string;
  /** Left out of the line when empty. */
  description: string;
};

/** A titled list of links, such as a tree's root node and its descendants. */
export type ListingSection = {
  title: string;
  links: Array<ListingLink>;
};

/** An MDX component's literal attribute value: anything JSON can hold. */
export type PageMarkdownPropValue =
  | string
  | number
  | boolean
  | null
  | Array<PageMarkdownPropValue>
  | { [key: string]: PageMarkdownPropValue };

/** What a component function receives. */
export type PageMarkdownComponentContext<Entry = unknown> = {
  /**
   * The component's literal attributes, so `<X open />` gives `open: true`.
   * Attributes set by any other expression are left out: qino never runs one.
   */
  props: Record<string, PageMarkdownPropValue>;
  /** The component's content as Markdown, its own components already replaced. */
  children: string;
  /** The entry being converted, as read: its relations are still slugs. */
  entry: Entry;
};

/** Turns an MDX component into Markdown, or returns `null` to keep it as written. */
export type PageMarkdownComponent<Entry = unknown> = (
  context: PageMarkdownComponentContext<Entry>,
) => Awaitable<string | null>;

/** Functions that replace MDX components, by component name. */
export type PageMarkdownComponents<Entry = unknown> = Readonly<
  Record<string, PageMarkdownComponent<Entry>>
>;

/** How a primitive's page Markdown reads, declared with its pages. */
export type PageMarkdownConfig<Entry, Ext> = {
  /**
   * Functions, by component name, whose output replaces an MDX component in
   * page Markdown. A component missing here stays as written. JSON files have
   * no body to replace them in.
   */
  readonly markdownComponents?: PageMarkdownComponents<Entry> &
    CheckMarkdownConfig<Ext>;
};

/** The functions that replace an entry's MDX components, and the entry they receive. */
export type ComponentReplacement<Entry> = {
  components?: PageMarkdownComponents<Entry>;
  /** The entry as read, before any view. */
  entry: Entry;
};

/** Where a node lies in the source, by offset. */
export type SourceRange = { start: number; end: number };

/** An MDX component in a parsed body, as a block or inline. */
export type MdxJsxElement = Extract<
  Nodes,
  { type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>;
