import { micromarkHeadingId } from "@qino/tooling/markdown";
import type { Processor } from "unified";

import { fromMarkdownHeadingId } from "./from-markdown-heading-id";

/** Parses `{#id}` into `headingId` nodes, as `remark-custom-heading-id` does. */
export function remarkHeadingId(this: Processor) {
  const data = this.data();

  data.micromarkExtensions ??= [];
  data.micromarkExtensions.push(micromarkHeadingId());
  data.fromMarkdownExtensions ??= [];
  data.fromMarkdownExtensions.push(fromMarkdownHeadingId());
}
