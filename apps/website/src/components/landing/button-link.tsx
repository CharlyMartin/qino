import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  variant?: "default" | "outline";
};

export function ButtonLink({ children, variant, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonVariants({ variant })} {...props}>
      {children}
    </Link>
  );
}
