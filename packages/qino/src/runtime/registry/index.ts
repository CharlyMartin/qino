import type { AnyCollection } from "../../types";
import { QinoMeta } from "../globals";

const REGISTRY_KEY = Symbol.for("qino.registry");

type RegistryHost = { [REGISTRY_KEY]?: Map<string, AnyCollection> };

function store(): Map<string, AnyCollection> {
  const host = globalThis as RegistryHost;
  if (!host[REGISTRY_KEY]) {
    host[REGISTRY_KEY] = new Map();
  }
  return host[REGISTRY_KEY];
}

export function register(collection: AnyCollection) {
  store().set(collection[QinoMeta].path, collection);
}

export function unregister(collection: AnyCollection) {
  store().delete(collection[QinoMeta].path);
}

export function getRegistry(): ReadonlyMap<string, AnyCollection> {
  return store();
}

export function clearRegistry() {
  store().clear();
}
