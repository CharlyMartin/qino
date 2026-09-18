import type { DocsNode } from "../../types/docs-node";
import { DocsList } from "./docs-list";

export function DocsSidebar({
  nodes,
  activeSlug,
}: {
  nodes: Array<DocsNode>;
  activeSlug?: string;
}) {
  return (
    <nav aria-label="Documentation" className="text-sm">
      <DocsList nodes={nodes} activeSlug={activeSlug} />
    </nav>
  );
}
