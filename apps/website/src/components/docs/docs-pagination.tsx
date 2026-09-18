import { Link } from "@tanstack/react-router";

import type { DocsNode } from "../../types/docs-node";

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
      className="mt-16 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800"
    >
      {previousNode ? (
        <Link
          to="/docs/$"
          params={{ _splat: previousNode.slug }}
          className="group flex flex-col items-start rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Previous
          </span>
          <span className="mt-1 text-sm font-medium group-hover:underline">
            {previousNode.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {nextNode ? (
        <Link
          to="/docs/$"
          params={{ _splat: nextNode.slug }}
          className="group flex flex-col items-end rounded-lg border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Next
          </span>
          <span className="mt-1 text-sm font-medium group-hover:underline">
            {nextNode.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
