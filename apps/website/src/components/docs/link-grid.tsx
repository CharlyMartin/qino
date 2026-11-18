import { getRouteApi } from "@tanstack/react-router";

import { DocsLinkGrid } from "./docs-link-grid";

const docsPageRoute = getRouteApi("/docs/$");

// Renders the current page's children; used in MDX as `<LinkGrid />`.
export function LinkGrid() {
  const { links } = docsPageRoute.useLoaderData();
  if (links.length == 0) return null;

  return (
    <nav aria-label="Pages in this section" className="not-prose my-8">
      <DocsLinkGrid links={links} />
    </nav>
  );
}
