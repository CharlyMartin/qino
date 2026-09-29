import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { useEffect, useState } from "react";

import type { DocsNode } from "../../types/docs-node";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { DocsLink } from "./docs-link";
import { DocsList } from "./docs-list";

export function DocsGroup({
  node,
  activeSlug,
  depth,
}: {
  node: DocsNode;
  activeSlug?: string;
  depth: number;
}) {
  const isActive = node.slug == activeSlug;
  const isInside = isActive || activeSlug?.startsWith(`${node.slug}/`) == true;
  const [open, setOpen] = useState(isInside);

  useEffect(() => {
    if (isInside) setOpen(true);
  }, [isInside]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-1">
        <DocsLink
          slug={node.slug}
          active={isActive}
          onClick={() => setOpen(isActive ? !open : true)}
        >
          {node.title}
        </DocsLink>
        <CollapsibleTrigger
          aria-label={`Toggle ${node.title}`}
          className="group rounded-sm p-1 text-muted-foreground transition-colors hover:bg-surface/50 hover:text-foreground"
        >
          <CaretRightIcon
            className="size-4 transition-transform group-data-panel-open:rotate-90"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent keepMounted className="ml-3 border-l pl-3">
        <DocsList
          nodes={node.children}
          activeSlug={activeSlug}
          depth={depth + 1}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
