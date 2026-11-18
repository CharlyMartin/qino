import { Link } from "@tanstack/react-router";

import { formatPostDate } from "@/lib/format-post-date";
import { DotSeparator } from "./dot-separator";

export type LatestPostBannerProps = {
  slug: string;
  title: string;
  publishedOn: string;
};

/**
 * A bar above the navbar that links to the newest blog post. Long titles are
 * cut short to fit. The whole bar is the link, but its focus ring goes around
 * the text: the bar spans the page's edges, which would clip a ring around it.
 */
export function LatestPostBanner({
  slug,
  title,
  publishedOn,
}: LatestPostBannerProps) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug }}
      className="group block border-b bg-surface-sunken text-sm font-medium text-muted-foreground transition-colors motion-reduce:transition-none hover:text-foreground-3 focus-visible:ring-0 focus-visible:ring-offset-0"
    >
      <span className="mx-auto flex max-w-7xl px-4 py-2.5 md:justify-center md:px-7 lg:px-12">
        <span className="-mx-2 flex min-w-0 items-center gap-2 rounded-sm px-2 py-0.5 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface-sunken">
          <time
            dateTime={publishedOn}
            className="shrink-0 font-mono text-label uppercase text-muted-foreground"
          >
            {formatPostDate(publishedOn)}
          </time>
          <DotSeparator />
          <span className="min-w-0 truncate underline-offset-4 group-hover:underline">
            {title}
          </span>
        </span>
      </span>
    </Link>
  );
}
