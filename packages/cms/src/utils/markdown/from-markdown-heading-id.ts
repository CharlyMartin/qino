import type { Literal } from "mdast";
import type { Extension } from "mdast-util-from-markdown";

/** A `{#id}` in the Markdown tree: `value` is the id. */
export type HeadingIdNode = Literal & { type: "headingId" };

declare module "mdast" {
  interface PhrasingContentMap {
    headingId: HeadingIdNode;
  }
  interface RootContentMap {
    headingId: HeadingIdNode;
  }
}

/** Turns `micromarkHeadingId` tokens into `headingId` nodes. */
export function fromMarkdownHeadingId() {
  const extension: Extension = {
    enter: {
      qinoHeadingId(token) {
        this.enter({ type: "headingId", value: "" }, token);
      },
      qinoHeadingIdString() {
        this.buffer();
      },
    },
    exit: {
      // The decoded text, as `remark-custom-heading-id` reads it.
      qinoHeadingIdString() {
        const id = this.resume();
        const node = this.stack.at(-1);
        if (node?.type == "headingId") node.value = id;
      },
      qinoHeadingId(token) {
        this.exit(token);
      },
    },
  };

  return extension;
}
