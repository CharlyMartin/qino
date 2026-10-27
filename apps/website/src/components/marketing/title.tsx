import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const titleVariants = cva("text-balance text-foreground", {
  variants: {
    size: {
      display:
        "text-4xl font-extrabold leading-none tracking-tighter md:text-5xl lg:text-display",
      heading:
        "text-3xl font-extrabold leading-tight tracking-tighter md:text-heading",
      "heading-lg":
        "text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl",
      row: "text-row",
    },
  },
  defaultVariants: { size: "heading" },
});

type TitleProps = Omit<ComponentProps<"h2">, "className"> &
  VariantProps<typeof titleVariants> & {
    as?: "h1" | "h2" | "h3";
  };

export function Title({ as: Tag = "h2", size, ...props }: TitleProps) {
  return <Tag className={titleVariants({ size })} {...props} />;
}
