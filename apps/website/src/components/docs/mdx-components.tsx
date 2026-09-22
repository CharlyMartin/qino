import type { MDXRemoteProps } from "next-mdx-remote";

import { Callout } from "./callout";
import { MdxLink } from "./mdx-link";

export const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
  a: MdxLink,
};
