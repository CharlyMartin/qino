import type { STATS_FIELD_NAME } from "../data/globals";
import type { MarkdownStats } from "../utils/markdown/get-markdown-stats";

export type { MarkdownStats };

// Type-only metadata, like `QinoMediaPaths`: never created at runtime.
declare const QinoMarkdownStats: unique symbol;

/** Type-only tag carried on `Rels`, like `MediaPathsTag`. */
export type MarkdownStatsTag<Stats extends boolean> = [Stats] extends [true]
  ? { readonly [QinoMarkdownStats]?: true }
  : unknown;

/** Adds `_stats` when `Rels` is tagged with `markdown.stats`. */
export type WithStats<T, Rels> = typeof QinoMarkdownStats extends keyof Rels
  ? T & { [K in typeof STATS_FIELD_NAME]: MarkdownStats }
  : T;
