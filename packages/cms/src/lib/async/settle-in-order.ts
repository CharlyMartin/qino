import type { Awaitable } from "../../types/augment";
import { unwrapSettled } from "./unwrap-settled";

/**
 * Waits for the promises among `values` and returns every value in order, or
 * throws the first rejection in their order, like `unwrapSettled`. Plain
 * values aren't wrapped in promises, so a list of mostly plain values, such as
 * entries augmented without async work, stays cheap.
 */
export async function settleInOrder<Value>(
  values: ReadonlyArray<Awaitable<Value>>,
) {
  const pending = values.filter((value) => value instanceof Promise);
  const settled = await Promise.allSettled(pending);

  let next = 0;
  return unwrapSettled(
    values.map((value) =>
      value instanceof Promise
        ? (settled[next++] as PromiseSettledResult<Value>)
        : ({ status: "fulfilled", value } as const),
    ),
  );
}
