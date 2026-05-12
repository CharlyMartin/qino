type CreateRegistryParams<T> = {
  key: `qino.registry.${string}`;
  getKey: (entity: T) => string;
};

export function createRegistry<T>({ key, getKey }: CreateRegistryParams<T>) {
  const REGISTRY_KEY = Symbol.for(key);

  return {
    register(entity: T) {
      store().set(getKey(entity), entity);
    },
    unregister(entity: T) {
      store().delete(getKey(entity));
    },
    getRegistry() {
      return store();
    },
    clearRegistry() {
      store().clear();
    },
  };

  function store(): Map<string, T> {
    const host = globalThis as { [k: symbol]: Map<string, T> };
    let map = host[REGISTRY_KEY];

    if (!map) {
      map = new Map();
      host[REGISTRY_KEY] = map;
    }

    return map;
  }
}
