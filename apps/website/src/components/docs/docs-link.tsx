import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

const docsLinkVariants = cva("rounded-sm px-2 py-1 transition-colors", {
  variants: {
    level: {
      section: "font-medium text-foreground hover:bg-surface/50",
      page: "",
    },
    active: {
      true: "bg-surface font-medium text-foreground hover:bg-surface",
      false: "",
    },
  },
  compoundVariants: [
    {
      level: "page",
      active: false,
      className:
        "text-muted-foreground hover:bg-surface/50 hover:text-foreground",
    },
  ],
  defaultVariants: { level: "page", active: false },
});

type DocsLinkProps = VariantProps<typeof docsLinkVariants> & {
  slug: string;
  children: ReactNode;
  onClick?: () => void;
};

export function DocsLink({
  slug,
  level,
  active,
  children,
  onClick,
}: DocsLinkProps) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: slug }}
      activeOptions={{ exact: true }}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={docsLinkVariants({ level, active })}
    >
      {children}
    </Link>
  );
}
