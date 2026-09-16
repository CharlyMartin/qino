import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { ResolveOption } from "../../types/resolve";

export function normalizeDepth(
  value: ResolveOption,
  depth: number = MAX_RESOLVE_DEPTH,
) {
  if (value === true) return depth;
  if (value === false) return 0;
  if (typeof value == "number") {
    return Math.min(depth, Math.max(0, Math.floor(value)));
  }
  return 0;
}
