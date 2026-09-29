import type { DocsNode } from "../../types/docs-node";
import { DocsGroup } from "./docs-group";
import { DocsLink } from "./docs-link";

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
              <DocsLink
                slug={node.slug}
                level={depth == 0 ? "section" : "page"}
                active={node.slug == activeSlug}
              >
                {node.title}
              </DocsLink>
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
