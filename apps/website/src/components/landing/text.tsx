import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const textVariants = cva("text-pretty text-muted-foreground", {
  variants: {
    size: {
      lead: "text-lead",
      body: "text-body",
    },
  },
  defaultVariants: { size: "body" },
});

type TextProps = Omit<ComponentProps<"p">, "className"> &
  VariantProps<typeof textVariants>;

export function Text({ size, ...props }: TextProps) {
  return <p className={textVariants({ size })} {...props} />;
}
