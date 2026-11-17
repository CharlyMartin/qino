type Run<Value> = () => Promise<Value>;

/**
 * Lets concurrent calls with the same key share one pending promise, such as
 * the pages a build renders at once. It's forgotten as soon as it settles, so
 * a later call starts its own run: nothing is kept, so nothing can go stale.
 */
export function createInFlightCache() {
  const pending = new Map<string, Promise<unknown>>();

  return { run };

  function run<Value>(key: string, start: Run<Value>) {
    const current = pending.get(key);
    if (current) return current as Promise<Value>;

    const value = start();
    pending.set(key, value);
    const forget = () => {
      if (pending.get(key) == value) pending.delete(key);
    };
    value.then(forget, forget);
    return value;
  }
}
