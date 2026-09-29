import type { ComponentProps } from "react";

type InlineCodeProps = Omit<ComponentProps<"code">, "className">;

export function InlineCode(props: InlineCodeProps) {
  return (
    <code
      className="rounded-xs bg-surface px-1 py-0.5 font-mono text-sm text-foreground-3 wrap-break-word"
      {...props}
    />
  );
}
