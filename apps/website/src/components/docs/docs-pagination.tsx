import type { DocsNode } from "../../types/docs-node";
import { DocsLinkCard } from "./docs-link-card";

export function DocsPagination({
  previousNode,
  nextNode,
}: {
  previousNode: DocsNode | null;
  nextNode: DocsNode | null;
}) {
  return (
    <nav
      aria-label="Previous and next pages"
      className="mt-16 grid grid-cols-2 gap-3 border-t pt-8 sm:gap-4"
    >
      {previousNode ? (
        <DocsLinkCard
          slug={previousNode.slug}
          title={previousNode.title}
          label="Previous"
        />
      ) : (
        <span />
      )}
      {nextNode ? (
        <DocsLinkCard
          slug={nextNode.slug}
          title={nextNode.title}
          label="Next"
          align="end"
        />
      ) : (
        <span />
      )}
    </nav>
  );
}
