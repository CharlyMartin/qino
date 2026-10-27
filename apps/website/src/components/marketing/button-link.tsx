import { Link, type LinkProps } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

type ButtonLinkProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
  };

export function ButtonLink({
  children,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonVariants({ variant, size })} {...props}>
      {children}
    </Link>
  );
}
