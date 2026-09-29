import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const calloutVariants = cva(
  "not-prose my-6 rounded-sm border px-4 py-3 text-sm leading-relaxed text-foreground-2",
  {
    variants: {
      type: {
        note: "border-border-strong bg-surface/50",
        warn: "border-primary-muted bg-primary-muted/20",
        tip: "border-green-900 bg-green-950/30",
      },
    },
    defaultVariants: { type: "note" },
  },
);

type CalloutProps = VariantProps<typeof calloutVariants> & {
  children: ReactNode;
};

export function Callout({ type, children }: CalloutProps) {
  return <div className={calloutVariants({ type })}>{children}</div>;
}
