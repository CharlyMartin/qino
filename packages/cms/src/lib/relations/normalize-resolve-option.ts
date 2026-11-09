import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { ResolveOption } from "../../types/resolve";

/**
 * `true` lets each relation resolve its own `resolveDepth`; `false` and
 * `{ depth }` set the depth of every relation.
 */
export function normalizeResolveOption(value: ResolveOption) {
  if (value === true) return { depth: MAX_RESOLVE_DEPTH, override: false };
  if (value === false) return { depth: 0, override: true };
  return { depth: clampDepth(value.depth), override: true };
}

function clampDepth(depth: number) {
  return Math.min(MAX_RESOLVE_DEPTH, Math.max(0, Math.floor(depth)));
}
