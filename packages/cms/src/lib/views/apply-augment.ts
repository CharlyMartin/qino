import type { AnyEntry } from "../../types/utils";
import { augmentEntry } from "../augment/augment-entry";
import type { RuntimeView } from "./select-view";

/** Runs the view's `augment` on an entry whose relations are resolved. */
export function applyAugment(entry: AnyEntry, { augment }: RuntimeView) {
  return augmentEntry(
    entry,
    augment ? (value) => augment(value as never) : undefined,
  );
}
