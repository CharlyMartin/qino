import { Link } from "@tanstack/react-router";

import type { DocsNode } from "../../types/docs-node";
import { DocsGroup } from "./docs-group";

export function DocsList({
  nodes,
  activeSlug,
  depth = 0,
}: {
  nodes: Array<DocsNode>;
  activeSlug?: string;
  depth?: number;
}) {
  return (
    <ul className={depth == 0 ? "flex flex-col gap-6" : "flex flex-col gap-1"}>
      {nodes.map((node) => (
        <li key={node.slug} className="flex flex-col gap-1">
          {node.children.length > 0 && depth >= 1 ? (
            <DocsGroup node={node} activeSlug={activeSlug} depth={depth} />
          ) : (
            <>
              <Link
                to="/docs/$"
                params={{ _splat: node.slug }}
                aria-current={node.slug == activeSlug ? "page" : undefined}
                className={
                  depth == 0
                    ? "rounded-md px-2 py-1 font-medium text-zinc-950 hover:bg-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    : node.slug == activeSlug
                      ? "rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                      : "rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }
              >
                {node.title}
              </Link>
              {node.children.length > 0 ? (
                <DocsList
                  nodes={node.children}
                  activeSlug={activeSlug}
                  depth={depth + 1}
                />
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
