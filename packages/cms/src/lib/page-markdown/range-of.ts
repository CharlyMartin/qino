import type { Nodes } from "mdast";

import type { SourceRange } from "../../types/page-markdown";

/** Where a parsed node lies in its source. */
export function rangeOf(node: Nodes) {
  return {
    start: node.position?.start.offset ?? 0,
    end: node.position?.end.offset ?? 0,
  } satisfies SourceRange;
}
