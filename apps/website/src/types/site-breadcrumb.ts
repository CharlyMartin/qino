import type { LinkProps } from "@tanstack/react-router";

export type SiteBreadcrumb = {
  title: string;
  /** Left out for the current page. */
  link?: LinkProps;
};
