import type sharp from "sharp";

let loading: Promise<typeof sharp> | undefined;

/**
 * Loads sharp on first use. A native module that failed to load won't load
 * later, so neither does this: a serverless bundle without sharp's binary
 * rejects every call.
 */
export function loadSharp() {
  loading ??= import("sharp").then((module) => module.default);
  return loading;
}
