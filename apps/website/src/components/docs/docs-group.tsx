import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import type { DocsNode } from "../../types/docs-node";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
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
    setOpen(isInside);
  }, [isInside]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <Link
          to="/docs/$"
          params={{ _splat: node.slug }}
          aria-current={isActive ? "page" : undefined}
          className={
            isActive
              ? "flex-1 rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50"
              : "flex-1 rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          }
        >
          {node.title}
        </Link>
        <CollapsibleTrigger
          aria-label={`Toggle ${node.title}`}
          className="group rounded-md p-1 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          <ChevronRight className="size-4 transition-transform group-data-panel-open:rotate-90" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent
        keepMounted
        className="ml-3 border-l border-zinc-200 pl-3 dark:border-zinc-800"
      >
        <DocsList
          nodes={node.children}
          activeSlug={activeSlug}
          depth={depth + 1}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
