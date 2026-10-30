import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import type { DocsNode } from "../../types/docs-node";

type DocsBreadcrumb = Pick<DocsNode, "slug" | "title">;

type DocsBreadcrumbsProps = {
  /** From the root down, ending with the current page. */
  breadcrumbs: Array<DocsBreadcrumb>;
};

export function DocsBreadcrumbs({ breadcrumbs }: DocsBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground font-medium">
        {breadcrumbs.map((crumb, index) => {
          const isCurrent = index == breadcrumbs.length - 1;
          return (
            <Fragment key={crumb.slug}>
              {index > 0 ? <li aria-hidden="true">/</li> : null}
              {isCurrent ? (
                <li aria-current="page" className="text-foreground">
                  {crumb.title}
                </li>
              ) : (
                <li>
                  <Link
                    to="/docs/$"
                    params={{ _splat: crumb.slug }}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.title}
                  </Link>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
