import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import type { SiteBreadcrumb } from "../../types/site-breadcrumb";

type SiteBreadcrumbsProps = {
  /** From the section down, ending with the current page. */
  breadcrumbs: Array<SiteBreadcrumb>;
};

/**
 * The trail after the logo in the site header, from md up: below that, the
 * docs show their mobile menu instead. Each crumb opens with a slash, so the
 * first one also separates the trail from the logo.
 */
export function SiteBreadcrumbs({ breadcrumbs }: SiteBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.title}>
            <li aria-hidden="true" className="text-border-strong">
              /
            </li>
            {crumb.link ? (
              <li className="shrink-0">
                {/* Exact, or a crumb above the page would match it too. */}
                <Link
                  {...crumb.link}
                  activeOptions={{ exact: true }}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.title}
                </Link>
              </li>
            ) : (
              <li
                aria-current="page"
                className="min-w-0 truncate text-foreground"
              >
                {crumb.title}
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
