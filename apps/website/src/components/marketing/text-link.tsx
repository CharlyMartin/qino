import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

type TextLinkProps = LinkProps & {
  children: ReactNode;
};

/** An inline link to a page on the site, styled like `ExternalLink`. */
export function TextLink(props: TextLinkProps) {
  return (
    <Link
      className="text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
      {...props}
    />
  );
}
