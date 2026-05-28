import Link from "next/link";

import type { NodeTree } from "qino";

type DocsSidebarProps = {
  nodes: Array<NodeTree>;
  activeSlug?: string;
};

export function DocsSidebar({ nodes, activeSlug }: DocsSidebarProps) {
  return (
    <nav className="text-sm">
      <DocsList nodes={nodes} activeSlug={activeSlug} />
    </nav>
  );
}

function DocsList({
  nodes,
  activeSlug,
}: {
  nodes: Array<NodeTree>;
  activeSlug?: string;
}) {
  if (nodes.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1">
      {nodes.map((node) => {
        const isActive = node.slug === activeSlug;
        return (
          <li key={node.slug} className="flex flex-col gap-1">
            <Link
              href={`/docs/${node.slug}`}
              className={
                isActive
                  ? "rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
                  : "rounded-md px-2 py-1 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }
            >
              {node.title}
            </Link>
            {node.children.length > 0 && (
              <div className="ml-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                <DocsList nodes={node.children} activeSlug={activeSlug} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
