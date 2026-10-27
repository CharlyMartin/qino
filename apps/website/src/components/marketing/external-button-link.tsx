import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";

type ExternalButtonLinkProps = Omit<ComponentProps<"a">, "className"> &
  VariantProps<typeof buttonVariants> & {
    href: string;
  };

export function ExternalButtonLink({
  variant,
  size,
  ...props
}: ExternalButtonLinkProps) {
  return <a className={buttonVariants({ variant, size })} {...props} />;
}
