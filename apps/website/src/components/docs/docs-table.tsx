import type { ComponentProps } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

type DocsTableProps = ComponentProps<"table">;

// Renders Markdown tables: a wide one scrolls sideways instead of widening the page.
export function DocsTable(props: DocsTableProps) {
  return (
    <div className="my-8">
      <ScrollArea orientation="horizontal">
        {/* Room below the last row for the scrollbar, which overlays it. */}
        <div className="pb-3">
          <table {...props} />
        </div>
      </ScrollArea>
    </div>
  );
}
