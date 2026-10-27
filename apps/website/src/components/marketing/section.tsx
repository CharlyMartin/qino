import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const sectionVariants = cva("border-b", {
  variants: {
    spacing: {
      default: "py-14 md:py-24",
      hero: "pt-10 pb-10 md:pt-14 md:pb-12 lg:pt-20 lg:pb-24",
      cta: "py-12 md:py-20",
      compact: "py-8",
      none: "py-0",
    },
    // Fills the remaining height of a flex column, e.g. to pin the footer down.
    grow: {
      true: "flex-1",
    },
  },
  defaultVariants: { spacing: "default" },
});

const containerVariants = cva("mx-auto max-w-7xl px-4 md:px-7 lg:px-12", {
  variants: {
    align: {
      start: "",
      center: "md:text-center",
    },
  },
  defaultVariants: { align: "start" },
});

type SectionProps = Omit<ComponentProps<"section">, "className"> &
  VariantProps<typeof sectionVariants> &
  VariantProps<typeof containerVariants> & {
    "aria-labelledby": string;
    // Skips the inner container so children can span the full width and own their padding.
    bleed?: boolean;
  };

export function Section({
  children,
  spacing,
  grow,
  align,
  bleed,
  ...props
}: SectionProps) {
  return (
    <section className={sectionVariants({ spacing, grow })} {...props}>
      {bleed ? (
        children
      ) : (
        <div className={containerVariants({ align })}>{children}</div>
      )}
    </section>
  );
}
