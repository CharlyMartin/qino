import { Link } from "@tanstack/react-router";

import type { DocsNode } from "../../types/docs-node";

export function DocsList({
  nodes,
  activeSlug,
}: {
  nodes: Array<DocsNode>;
  activeSlug?: string;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {nodes.map((node) => (
        <li key={node.slug} className="flex flex-col gap-1">
          <Link
            to="/docs/$"
            params={{ _splat: node.slug }}
            aria-current={node.slug == activeSlug ? "page" : undefined}
            className={
              node.slug == activeSlug
                ? "rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                : "rounded-md px-2 py-1 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            }
          >
            {node.title}
          </Link>
          {node.children.length > 0 ? (
            <div className="ml-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
              <DocsList nodes={node.children} activeSlug={activeSlug} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
