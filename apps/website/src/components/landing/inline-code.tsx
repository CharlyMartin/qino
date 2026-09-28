import type { ComponentProps } from "react";

type InlineCodeProps = Omit<ComponentProps<"code">, "className">;

export function InlineCode(props: InlineCodeProps) {
  return <code className="font-mono text-sm wrap-break-word" {...props} />;
}
