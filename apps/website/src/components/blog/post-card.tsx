import { Link } from "@tanstack/react-router";

import { formatPostDate } from "@/lib/format-post-date";

type PostCardProps = {
  slug: string;
  title: string;
  description: string;
  publishedOn: string;
  wordCount: number;
};

export function PostCard({
  slug,
  title,
  description,
  publishedOn,
  wordCount,
}: PostCardProps) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug }}
      className="grid w-full gap-3 rounded-sm border p-5 transition-colors hover:border-border-strong hover:bg-surface/50 sm:grid-cols-4 sm:gap-6 sm:p-5"
    >
      <time
        dateTime={publishedOn}
        className="font-mono text-label uppercase text-primary sm:pt-1.5"
      >
        {formatPostDate(publishedOn)}
      </time>
      <span className="flex flex-col gap-2 sm:col-span-3">
        <span className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
          {title}
        </span>
        <span className="text-pretty text-body text-muted-foreground">
          {description}
        </span>
        <span className="font-mono text-label uppercase text-muted-foreground">
          {wordCount.toLocaleString("en-US")} words
        </span>
      </span>
    </Link>
  );
}
