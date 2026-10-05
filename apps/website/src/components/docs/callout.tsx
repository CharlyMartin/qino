import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const calloutVariants = cva(
  "my-6 rounded-sm border px-5 py-4 text-foreground-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0",
  {
    variants: {
      type: {
        note: "border-sky-800 bg-sky-950/40",
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
