import type { MDXRemoteProps } from "next-mdx-remote";

import { Underline } from "../marketing/underline";
import { Callout } from "./callout";
import { CodeFigure } from "./code-figure";
import { DocsInstallBox } from "./docs-install-box";
import { LinkGrid } from "./link-grid";
import { MdxLink } from "./mdx-link";

export const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
  InstallBox: DocsInstallBox,
  LinkGrid,
  Underline,
  a: MdxLink,
  figure: CodeFigure,
};
