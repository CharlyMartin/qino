import { Link } from "@tanstack/react-router";

import { cn } from "../../lib/cn";
import type { SiteBreadcrumb } from "../../types/site-breadcrumb";
import { SiteBreadcrumbs } from "./site-breadcrumbs";

type SiteHeaderProps = {
  /** Replaces the main navigation with where the page sits on the site. */
  breadcrumbs?: Array<SiteBreadcrumb>;
  /** Spans the screen, as the docs do, instead of the centered column. */
  fullWidth?: boolean;
};

export function SiteHeader({ breadcrumbs, fullWidth }: SiteHeaderProps) {
  return (
    <header className="border-b">
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between px-4 md:px-7 lg:px-12",
          !fullWidth && "max-w-7xl",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label="qino home"
            className="shrink-0 text-lg font-extrabold tracking-tight"
          >
            qino
          </Link>
          {breadcrumbs ? <SiteBreadcrumbs breadcrumbs={breadcrumbs} /> : null}
        </div>
        {breadcrumbs ? null : (
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-6 text-sm font-medium text-muted-foreground"
          >
            <Link to="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <Link to="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link to="/cloud" className="text-primary hover:text-foreground">
              Cloud
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
