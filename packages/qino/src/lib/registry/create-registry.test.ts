import { describe, expect, test } from "vitest";

import { createRegistry } from "./create-registry";

type Entity = { id: string; label?: string };

let uid = 0;
function uniqueKey(): `qino.registry.${string}` {
  return `qino.registry.test-${++uid}`;
}

describe("createRegistry", () => {
  test("register stores an entity retrievable via getRegistry", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    const alice = { id: "alice", label: "Alice" };
    registry.register(alice);
    expect(registry.getRegistry().get("alice")).toBe(alice);
  });

  test("register called twice with the same key overwrites", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    registry.register({ id: "alice", label: "first" });
    registry.register({ id: "alice", label: "second" });
    expect(registry.getRegistry().get("alice")).toEqual({
      id: "alice",
      label: "second",
    });
  });

  test("unregister removes the entity by getKey", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    const alice = { id: "alice" };
    registry.register(alice);
    registry.unregister(alice);
    expect(registry.getRegistry().has("alice")).toBe(false);
  });

  test("unregister on a non-registered entity is a no-op", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    expect(() => registry.unregister({ id: "ghost" })).not.toThrow();
    expect(registry.getRegistry().size).toBe(0);
  });

  test("clearRegistry empties the map", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    registry.register({ id: "a" });
    registry.register({ id: "b" });
    registry.clearRegistry();
    expect(registry.getRegistry().size).toBe(0);
  });

  test("getRegistry returns the same Map instance on repeated calls", () => {
    const registry = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    expect(registry.getRegistry()).toBe(registry.getRegistry());
  });

  test("two registries sharing the same key share storage", () => {
    const sharedKey = uniqueKey();
    const a = createRegistry<Entity>({
      key: sharedKey,
      getKey: (entity) => entity.id,
    });
    const b = createRegistry<Entity>({
      key: sharedKey,
      getKey: (entity) => entity.id,
    });
    a.register({ id: "alice", label: "from-a" });
    expect(b.getRegistry().get("alice")).toEqual({
      id: "alice",
      label: "from-a",
    });
    expect(a.getRegistry()).toBe(b.getRegistry());
  });

  test("registries with different keys have independent storage", () => {
    const a = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    const b = createRegistry<Entity>({
      key: uniqueKey(),
      getKey: (entity) => entity.id,
    });
    a.register({ id: "alice" });
    expect(a.getRegistry().size).toBe(1);
    expect(b.getRegistry().size).toBe(0);
  });
});
