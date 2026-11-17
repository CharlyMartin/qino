type Derive<Source, Value> = (source: Source) => Promise<Value>;

/**
 * Keeps one derived value per source object, for as long as the source lives.
 * Pair it with `createFileCache`: a changed file loads a new source, so its old
 * derived value goes with the old source, and nothing needs invalidating. A
 * rejected value is dropped, so the next read derives it again.
 */
export function createDerivedCache() {
  const values = new WeakMap<object, Promise<unknown>>();

  return { read };

  function read<Source extends object, Value>(
    source: Source,
    derive: Derive<Source, Value>,
  ) {
    const cached = values.get(source);
    if (cached) return cached as Promise<Value>;

    const value = derive(source);
    values.set(source, value);
    value.catch(() => {
      if (values.get(source) == value) values.delete(source);
    });
    return value;
  }
}
