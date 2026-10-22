import type { STATS_FIELD_NAME } from "../data/globals";
import type { MarkdownStats } from "../utils/markdown/get-markdown-stats";
import type { MarkdownExtension } from "./generated-fields";
import type { SupportedFileExtension } from "./utils";

export type { MarkdownStats };

// Type-only metadata, like `QinoMediaPaths`: never created at runtime.
declare const QinoMarkdownStats: unique symbol;

/** Flags `markdownStats: true` on JSON files, which have no body to count. */
export type CheckMarkdownStats<
  Stats extends boolean,
  Ext extends SupportedFileExtension,
> = [Stats] extends [true]
  ? [Ext] extends [MarkdownExtension]
    ? unknown
    : { readonly "JSON files have no Markdown body to count": Ext }
  : unknown;

/** Type-only tag carried on `Rels`, like `MediaPathsTag`. */
export type MarkdownStatsTag<Stats extends boolean> = [Stats] extends [true]
  ? { readonly [QinoMarkdownStats]?: true }
  : unknown;

/** Adds `_stats` when `Rels` is tagged with `markdownStats`. */
export type WithStats<T, Rels> = typeof QinoMarkdownStats extends keyof Rels
  ? T & { [K in typeof STATS_FIELD_NAME]: MarkdownStats }
  : T;
