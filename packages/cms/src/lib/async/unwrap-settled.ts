/**
 * Returns the values of `Promise.allSettled` results, or throws the first
 * rejection in their order rather than in the order they settled. Work can run
 * concurrently and still fail with the error a one-by-one run would have hit.
 */
export function unwrapSettled<Value>(
  results: Array<PromiseSettledResult<Value>>,
) {
  return results.map((result) => {
    if (result.status == "rejected") throw result.reason;
    return result.value;
  });
}
