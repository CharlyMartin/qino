import type { MarkdownStats } from "@qino/cms";

import { formatPostDate } from "@/lib/format-post-date";

type PostMetaProps = {
  publishedOn: string;
  updatedOn?: string;
  _stats: MarkdownStats;
};

export function PostMeta({ publishedOn, updatedOn, _stats }: PostMetaProps) {
  return (
    <p className="flex flex-wrap items-center gap-2 font-mono text-label uppercase text-muted-foreground">
      <time dateTime={publishedOn}>{formatPostDate(publishedOn)}</time>
      {updatedOn && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Updated{" "}
            <time dateTime={updatedOn}>{formatPostDate(updatedOn)}</time>
          </span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span>{_stats.wordCount.toLocaleString("en-US")} words</span>
    </p>
  );
}
