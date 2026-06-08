import type { TreeNode } from "../../types";
import { removeExtension } from "../../utils/remove-extension";
import type { Order } from "./get-order-from-file";

type GetNodeTreesFromOrderParams = {
  order?: Order;
  candidates: Map<string, TreeNode>;
};

export function getOrderedNodes({
  order,
  candidates,
}: GetNodeTreesFromOrderParams) {
  if (!order) return [...candidates.values()];

  const result: Array<TreeNode> = [];
  const seen = new Set<string>();

  for (const fileName of order.entries) {
    const bareName = removeExtension(fileName);
    const node = candidates.get(bareName);

    if (!node) {
      throw new Error(
        `${order.path}: entry "${fileName}" does not exist on disk (no matching "${fileName}" file or non-empty "${bareName}/" folder).`,
      );
    }

    result.push(node);
    seen.add(bareName);
  }

  for (const [name, node] of candidates) {
    if (!seen.has(name)) result.push(node);
  }

  return result;
}
