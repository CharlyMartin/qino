import { Link } from "@tanstack/react-router";

export type LatestPostLinkProps = {
  slug: string;
  title: string;
};

/** Points the hero at the newest blog post. Long titles are cut short to fit. */
export function LatestPostLink({ slug, title }: LatestPostLinkProps) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug }}
      className="inline-flex max-w-full items-center gap-3 rounded-sm border border-border-strong px-3 py-1.5 text-sm text-foreground-2 transition-colors motion-reduce:transition-none hover:border-muted-foreground hover:text-foreground"
    >
      <span className="shrink-0 font-mono text-label text-primary">
        New post
      </span>
      <span className="min-w-0 truncate border-l border-border-strong pl-3">
        {title}
      </span>
    </Link>
  );
}
