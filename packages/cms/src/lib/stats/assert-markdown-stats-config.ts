type AssertMarkdownStatsConfigParams = {
  markdownStats: boolean;
  extension: string;
  primitiveId: string;
};

/** Fails at definition on `markdownStats` for JSON files, which have no body. */
export function assertMarkdownStatsConfig({
  markdownStats,
  extension,
  primitiveId,
}: AssertMarkdownStatsConfigParams) {
  if (markdownStats && extension == ".json") {
    throw new Error(
      `markdownStats of "${primitiveId}" counts the Markdown body, but JSON files have none.`,
    );
  }
}
