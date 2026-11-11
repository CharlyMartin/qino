import type { MARKDOWN_HEADING_TAGS, TOC_FIELD_NAME } from "../data/globals";

export type MarkdownHeadingTag = (typeof MARKDOWN_HEADING_TAGS)[number];

export type MarkdownHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type MarkdownTocHeading = {
  /** The heading level, `2` for `##`. */
  heading: MarkdownHeadingLevel;
  /** The anchor id: `{#custom}`, or slugged like `rehype-slug` does. */
  id: string;
  /** The heading's plain text, without MDX components. */
  text: string;
};

export type MarkdownToc = MarkdownTocHeading[];

export type MarkdownTocOptions = {
  /** The deepest heading level to list. Defaults to `"h6"`. */
  upTo?: MarkdownHeadingTag;
  /**
   * Turns a heading's `text` into its id, for sites that don't render ids
   * with `rehype-slug`. Duplicates get a `-1`, `-2` suffix.
   */
  slug?: (text: string) => string;
};

/** `true` lists every heading with `rehype-slug` ids; options tune that. */
export type MarkdownTocOption = boolean | MarkdownTocOptions;

// Type-only metadata, like `QinoMarkdownStats`: never created at runtime.
declare const QinoMarkdownToc: unique symbol;

// Type-only, so no value has this type: it only marks an options object.
declare const QinoMarkdownTocOptions: unique symbol;

/**
 * `markdown.toc` as inferred: `false` when left out or off, `true`, `boolean`
 * for a runtime boolean, or the whole constraint for an options object.
 * Options are never inferred, so a `slug` callback stays typed: an object
 * fails the constraint, which TypeScript then falls back to.
 */
export type MarkdownTocFlag = boolean | typeof QinoMarkdownTocOptions;

// A runtime `boolean` may be `false`, so it adds no `_toc`, like `_stats`.
type IsTocOn<Toc extends MarkdownTocFlag> =
  typeof QinoMarkdownTocOptions extends Toc
    ? true
    : [Toc] extends [true]
      ? true
      : false;

/** Type-only tag carried on `Rels`, like `MarkdownStatsTag`. */
export type MarkdownTocTag<Toc extends MarkdownTocFlag> =
  IsTocOn<Toc> extends true ? { readonly [QinoMarkdownToc]?: true } : unknown;

/** Adds `_toc` when `Rels` is tagged with `markdown.toc`. */
export type WithToc<T, Rels> = typeof QinoMarkdownToc extends keyof Rels
  ? T & { [K in typeof TOC_FIELD_NAME]: MarkdownToc }
  : T;
