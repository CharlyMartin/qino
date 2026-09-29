import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";

import type { DocsNode } from "../../types/docs-node";

const paginationLinkVariants = cva(
  "flex flex-col rounded-sm border p-3 transition-colors sm:p-4 hover:border-border-strong hover:bg-surface/50",
  {
    variants: {
      direction: {
        previous: "items-start",
        next: "items-end text-right",
      },
    },
  },
);

const LABELS = {
  previous: "Previous",
  next: "Next",
};

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
        <PaginationLink node={previousNode} direction="previous" />
      ) : (
        <span />
      )}
      {nextNode ? (
        <PaginationLink node={nextNode} direction="next" />
      ) : (
        <span />
      )}
    </nav>
  );
}

function PaginationLink({
  node,
  direction,
}: {
  node: DocsNode;
  direction: keyof typeof LABELS;
}) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: node.slug }}
      className={paginationLinkVariants({ direction })}
    >
      <span className="font-mono text-label uppercase text-muted-foreground">
        {LABELS[direction]}
      </span>
      <span className="mt-1 text-sm font-medium text-foreground sm:text-base">
        {node.title}
      </span>
    </Link>
  );
}
