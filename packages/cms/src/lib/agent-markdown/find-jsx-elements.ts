import type { Nodes } from "mdast";

import type { MdxJsxElement } from "../../types/agent-markdown";

/** The MDX components under `node`, outermost first: not those inside them. */
export function findJsxElements(node: Nodes): Array<MdxJsxElement> {
  if (!("children" in node)) return [];
  return node.children.flatMap((child) =>
    child.type == "mdxJsxFlowElement" || child.type == "mdxJsxTextElement"
      ? [child]
      : findJsxElements(child),
  );
}
