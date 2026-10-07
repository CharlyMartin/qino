import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";

const docsLinkCardVariants = cva(
  "flex h-full flex-col rounded-sm border p-3 transition-colors sm:p-4 hover:border-border-strong hover:bg-surface/50",
  {
    variants: {
      align: {
        start: "items-start",
        end: "items-end text-right",
      },
    },
    defaultVariants: { align: "start" },
  },
);

type DocsLinkCardProps = VariantProps<typeof docsLinkCardVariants> & {
  slug: string;
  title: string;
  label?: string;
  description?: string;
};

export function DocsLinkCard({
  slug,
  title,
  label,
  description,
  align,
}: DocsLinkCardProps) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: slug }}
      className={docsLinkCardVariants({ align })}
    >
      {label ? (
        <span className="mb-1 font-mono text-label uppercase text-muted-foreground">
          {label}
        </span>
      ) : null}
      <span className="text-sm font-medium text-foreground sm:text-base">
        {title}
      </span>
      {description ? (
        <span className="mt-1 text-sm text-muted-foreground">
          {description}
        </span>
      ) : null}
    </Link>
  );
}
