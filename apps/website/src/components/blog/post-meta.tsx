import { formatPostDate } from "@/lib/format-post-date";

type PostMetaProps = {
  publishedOn: string;
  wordCount: number;
};

export function PostMeta({ publishedOn, wordCount }: PostMetaProps) {
  return (
    <p className="flex flex-wrap items-center gap-2 font-mono text-label uppercase text-muted-foreground">
      <time dateTime={publishedOn}>{formatPostDate(publishedOn)}</time>
      <span aria-hidden="true">·</span>
      <span>{wordCount.toLocaleString("en-US")} words</span>
    </p>
  );
}
