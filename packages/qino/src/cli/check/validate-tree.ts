import { consola } from "consola";

import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyTree } from "../../types/tree";

export async function validateTree(tree: AnyTree) {
  const { directory } = tree[QinoPrimitiveMarker];

  try {
    const nodes = await tree.getTree();

    if (nodes.length == 0) {
      consola.warn(`Tree "${directory}" is empty.`);
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Tree "${directory}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
