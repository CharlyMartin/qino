import type { MarkdownToc } from "@qino/cms";

import { cn } from "../../lib/cn";
import { getTocIndent } from "../../lib/get-toc-indent";

type DocsTocProps = {
  toc: MarkdownToc;
  activeId?: string;
};

export function DocsToc({ toc, activeId }: DocsTocProps) {
  const topHeading = Math.min(...toc.map(({ heading }) => heading));

  return (
    <nav aria-labelledby="docs-toc-title" className="text-sm">
      <p
        id="docs-toc-title"
        className="mb-4 font-mono text-label uppercase text-muted-foreground"
      >
        On this page
      </p>
      <ul className="flex flex-col border-l border-border-strong">
        {toc.map(({ heading, id, text }) => (
          <li key={id}>
            {/* A long heading is cut short, and shown whole in the title or
                on keyboard focus. */}
            <a
              href={`#${id}`}
              title={text}
              aria-current={id == activeId ? "location" : undefined}
              className={cn(
                "-ml-px block truncate border-l focus-visible:whitespace-normal focus-visible:wrap-break-word border-transparent py-1 pr-2 font-medium text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none aria-[current=location]:border-foreground aria-[current=location]:text-foreground",
                getTocIndent(heading - topHeading),
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
