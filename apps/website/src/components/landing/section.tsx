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
  };

export function Section({ children, spacing, align, ...props }: SectionProps) {
  return (
    <section className={sectionVariants({ spacing })} {...props}>
      <div className={containerVariants({ align })}>{children}</div>
    </section>
  );
}
