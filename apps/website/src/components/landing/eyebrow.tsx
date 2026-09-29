import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const eyebrowVariants = cva("font-mono text-label uppercase", {
  variants: {
    tone: {
      accent: "text-primary",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: { tone: "muted" },
});

type EyebrowProps = Omit<ComponentProps<"p">, "className"> &
  VariantProps<typeof eyebrowVariants>;

export function Eyebrow({ tone, ...props }: EyebrowProps) {
  return <p className={eyebrowVariants({ tone })} {...props} />;
}
