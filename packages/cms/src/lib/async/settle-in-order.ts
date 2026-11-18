import { unwrapSettled } from "./unwrap-settled";

/**
 * Waits for the thenables among `values` and returns every value in order, or
 * throws the first rejection in their order, like `unwrapSettled`. Plain
 * values aren't wrapped in promises, so a list of mostly plain values, such as
 * entries augmented without async work, stays cheap. Anything with a `then`
 * counts, as with `Promise.all`, so a promise still counts when it isn't an
 * instance of the global `Promise`, such as one from another realm.
 */
export async function settleInOrder<Value>(
  values: ReadonlyArray<Value | PromiseLike<Value>>,
) {
  // Checked once: settling a thenable can remove its `then`.
  const isPending = values.map(
    (value) =>
      ((typeof value == "object" && value != null) ||
        typeof value == "function") &&
      "then" in value,
  );
  const settled = await Promise.allSettled(
    values.filter((_, index) => isPending[index]),
  );

  let next = 0;
  return unwrapSettled(
    values.map((value, index) =>
      isPending[index]
        ? (settled[next++] as PromiseSettledResult<Value>)
        : ({ status: "fulfilled", value } as PromiseFulfilledResult<Value>),
    ),
  );
}
