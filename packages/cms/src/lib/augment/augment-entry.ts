import type { AugmentOutput, Awaitable } from "../../types/augment";
import {
  type AugmentedSource,
  mergeAugmentOutput,
} from "./merge-augment-output";
import { toAugmentError } from "./to-augment-error";

/**
 * Adds the fields `augment` returns to an entry. A sync `augment` is merged
 * right away, without a promise, so augmenting thousands of entries stays
 * cheap where every promise costs extra, as under `next dev`. An async one
 * returns a promise of the merged entry.
 */
export function augmentEntry<
  Entry extends Record<string, unknown>,
  Output extends AugmentOutput,
>(
  entry: Entry & AugmentedSource,
  augment?: (entry: Readonly<Entry>) => Awaitable<Output>,
) {
  if (!augment) return entry;

  let output: Awaitable<Output>;

  try {
    output = augment(entry);
  } catch (cause) {
    throw toAugmentError(entry, cause);
  }

  // `in` doesn't run a `then` getter. Anything with a `then` goes through
  // `await`, which reads and calls it exactly as before.
  const mayBeThenable =
    (typeof output == "object" && output != null) ||
    typeof output == "function";
  if (mayBeThenable && "then" in output) {
    const pending = output;
    return (async () => {
      let value: Output;
      try {
        value = await pending;
      } catch (cause) {
        throw toAugmentError(entry, cause);
      }
      return mergeAugmentOutput(entry, value);
    })();
  }

  return mergeAugmentOutput(entry, output);
}
