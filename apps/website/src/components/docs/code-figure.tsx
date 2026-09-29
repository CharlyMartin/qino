import type { ComponentProps } from "react";

import { CopyButton } from "@/components/landing/copy-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type CodeFigureProps = ComponentProps<"figure"> & {
  "data-title"?: string;
  "data-code"?: string;
};

// Renders figures from `rehypeCodeTitle`: a title bar with a copy button above the code.
export function CodeFigure({
  "data-title": title,
  "data-code": code,
  children,
  ...props
}: CodeFigureProps) {
  const { status, copy } = useCopyToClipboard(code ?? "");

  if (title == null || code == null) {
    return <figure {...props}>{children}</figure>;
  }

  return (
    <figure className="overflow-hidden rounded-sm border bg-surface/50">
      {/* not-prose: typography's figcaption margin would stretch the button's row. */}
      <div className="not-prose grid grid-cols-[minmax(0,1fr)_auto] border-b">
        <figcaption className="truncate px-4 py-3 font-mono text-xs text-muted-foreground">
          {title}
        </figcaption>
        <CopyButton
          size="sm"
          status={status}
          onCopy={copy}
          label={`Copy ${title}`}
        />
      </div>
      {children}
    </figure>
  );
}
