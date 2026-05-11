import type { ResolveOption } from "../../types/resolve";

export const MAX_DEPTH = 6;

export function normalizeDepth(value: ResolveOption) {
  if (value === true) return MAX_DEPTH;
  if (value === false) return 0;
  if (typeof value == "number") {
    return Math.min(MAX_DEPTH, Math.max(0, Math.floor(value)));
  }
  return 0;
}
