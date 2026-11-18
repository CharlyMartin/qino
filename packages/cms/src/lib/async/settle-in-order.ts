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
  const isPending = (value: Value | PromiseLike<Value>) =>
    typeof value == "object" && value != null && "then" in value;
  const pending = values.filter(isPending);
  const settled = await Promise.allSettled(pending);

  let next = 0;
  return unwrapSettled(
    values.map((value) =>
      isPending(value)
        ? (settled[next++] as PromiseSettledResult<Value>)
        : ({ status: "fulfilled", value } as PromiseFulfilledResult<Value>),
    ),
  );
}
