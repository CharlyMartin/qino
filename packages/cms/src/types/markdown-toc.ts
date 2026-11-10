import type { MARKDOWN_HEADING_TAGS, TOC_FIELD_NAME } from "../data/globals";
import type { MarkdownExtension } from "./generated-fields";
import type { SupportedFileExtension } from "./utils";

export type MarkdownHeadingTag = (typeof MARKDOWN_HEADING_TAGS)[number];

export type MarkdownHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type MarkdownTocHeading = {
  /** The heading level, `2` for `##`. */
  heading: MarkdownHeadingLevel;
  /** The anchor id, slugged like `rehype-slug` does. */
  id: string;
  /** The heading's plain text. */
  text: string;
};

export type MarkdownToc = MarkdownTocHeading[];

/** `true` lists every heading, `{ upTo: "h3" }` stops at that level. */
export type MarkdownTocOption = boolean | { upTo: MarkdownHeadingTag };

// Type-only metadata, like `QinoMarkdownStats`: never created at runtime.
declare const QinoMarkdownToc: unique symbol;

type IsTocOn<Toc extends MarkdownTocOption> = [Toc] extends [
  true | { upTo: MarkdownHeadingTag },
]
  ? true
  : false;

/** Flags `markdownToc` on JSON files, which have no headings to list. */
export type CheckMarkdownToc<
  Toc extends MarkdownTocOption,
  Ext extends SupportedFileExtension,
> =
  IsTocOn<Toc> extends true
    ? [Ext] extends [MarkdownExtension]
      ? unknown
      : { readonly "JSON files have no Markdown headings to list": Ext }
    : unknown;

/** Type-only tag carried on `Rels`, like `MarkdownStatsTag`. */
export type MarkdownTocTag<Toc extends MarkdownTocOption> =
  IsTocOn<Toc> extends true ? { readonly [QinoMarkdownToc]?: true } : unknown;

/** Adds `_toc` when `Rels` is tagged with `markdownToc`. */
export type WithToc<T, Rels> = typeof QinoMarkdownToc extends keyof Rels
  ? T & { [K in typeof TOC_FIELD_NAME]: MarkdownToc }
  : T;
