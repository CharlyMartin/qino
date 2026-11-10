import { Select } from "@base-ui/react/select";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import type { MarkdownToc } from "@qino/cms";

import { cn } from "../../lib/cn";
import { getTocIndent } from "../../lib/get-toc-indent";

type DocsTocSelectProps = {
  toc: MarkdownToc;
  activeId?: string;
};

export function DocsTocSelect({ toc, activeId }: DocsTocSelectProps) {
  const topHeading = Math.min(...toc.map(({ heading }) => heading));
  const items = toc.map(({ id, text }) => ({ value: id, label: text }));

  function jumpToHeading(id: string | null) {
    if (id == null) return;

    // Instant, so the value doesn't walk through every section on the way.
    document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    window.history.replaceState(window.history.state, "", `#${id}`);
  }

  return (
    <Select.Root
      items={items}
      value={activeId ?? null}
      onValueChange={jumpToHeading}
    >
      <div className="flex items-center gap-3">
        <Select.Label className="shrink-0 font-mono text-label uppercase text-muted-foreground">
          On this page
        </Select.Label>
        <Select.Trigger className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-sm border border-border-strong bg-surface-sunken px-3 py-2 text-left text-sm font-medium text-foreground outline-none transition-colors hover:border-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none">
          <Select.Value className="truncate" />
          <Select.Icon className="shrink-0 text-muted-foreground">
            <CaretUpDownIcon className="size-4" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner
          className="z-40 outline-none"
          sideOffset={6}
          align="end"
          alignItemWithTrigger={false}
        >
          <Select.Popup className="max-h-[min(var(--available-height),24rem)] w-(--anchor-width) overflow-y-auto overscroll-contain rounded-sm border border-border-strong bg-background py-1 text-sm shadow-lg outline-none transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Select.List>
              {toc.map(({ heading, id, text }) => (
                <Select.Item
                  key={id}
                  value={id}
                  className={cn(
                    "flex cursor-default items-center justify-between gap-2 py-1.5 pr-3 font-medium text-muted-foreground outline-none select-none data-highlighted:bg-surface data-highlighted:text-foreground data-selected:text-foreground",
                    getTocIndent(heading - topHeading),
                  )}
                >
                  <Select.ItemText>{text}</Select.ItemText>
                  <Select.ItemIndicator className="shrink-0">
                    <CheckIcon className="size-4" aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
