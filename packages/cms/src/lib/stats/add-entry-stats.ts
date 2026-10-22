import { MARKDOWN_FIELD_NAME, STATS_FIELD_NAME } from "../../data/globals";

type AddEntryStatsParams<Entry> = {
  entry: Entry;
  markdownStats: boolean;
};

/**
 * Adds `_stats` from the Markdown body when `markdownStats` is on. The
 * Markdown parsers are only imported then.
 */
export async function addEntryStats<Entry extends object>({
  entry,
  markdownStats,
}: AddEntryStatsParams<Entry>) {
  if (!markdownStats) return entry;

  const { getMarkdownStats } = await import(
    "../../utils/markdown/get-markdown-stats"
  );
  const body = (entry as Record<string, unknown>)[MARKDOWN_FIELD_NAME];

  return {
    ...entry,
    [STATS_FIELD_NAME]: getMarkdownStats(typeof body == "string" ? body : ""),
  };
}
