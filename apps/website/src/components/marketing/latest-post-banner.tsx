import { Link } from "@tanstack/react-router";

export type LatestPostBannerProps = {
  slug: string;
  title: string;
};

/**
 * A bar above the navbar that links to the newest blog post. Long titles are
 * cut short to fit.
 */
export function LatestPostBanner({ slug, title }: LatestPostBannerProps) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug }}
      className="group block border-b bg-surface text-sm text-foreground-2 transition-colors motion-reduce:transition-none hover:text-foreground"
    >
      <span className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:justify-center md:px-7 lg:px-12">
        <span className="shrink-0 font-mono text-label text-primary">
          New post
        </span>
        <span className="min-w-0 truncate underline-offset-4 group-hover:underline">
          {title}
        </span>
      </span>
    </Link>
  );
}
