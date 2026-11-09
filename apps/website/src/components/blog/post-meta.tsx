import type { MarkdownStats } from "@qino/cms";

import { DotSeparator } from "@/components/marketing/dot-separator";
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
          <DotSeparator />
          <span>
            Updated{" "}
            <time dateTime={updatedOn}>{formatPostDate(updatedOn)}</time>
          </span>
        </>
      )}
      <DotSeparator />
      <span>{_stats.wordCount.toLocaleString("en-US")} words</span>
    </p>
  );
}
