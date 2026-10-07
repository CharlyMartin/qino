import { getRouteApi } from "@tanstack/react-router";

import { DocsLinkCard } from "./docs-link-card";

const docsPageRoute = getRouteApi("/docs/$");

// Renders the current page's children; used in MDX as `<LinkGrid />`.
export function LinkGrid() {
  const { links } = docsPageRoute.useLoaderData();
  if (links.length == 0) return null;

  return (
    <nav
      aria-label="Pages in this section"
      className="not-prose my-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
    >
      {links.map((link) => (
        <DocsLinkCard
          key={link.slug}
          slug={link.slug}
          title={link.title}
          description={link.description}
        />
      ))}
    </nav>
  );
}
