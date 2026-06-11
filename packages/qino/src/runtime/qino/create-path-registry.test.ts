import { describe, expect, test } from "vitest";

import { createPathRegistry } from "./create-path-registry";

describe("createPathRegistry", () => {
  test("registers disjoint paths without throwing", () => {
    const registry = createPathRegistry();
    expect(() => {
      registry.register({ kind: "collection", path: "/authors" });
      registry.register({ kind: "tree", path: "/docs" });
      registry.register({ kind: "singleton", path: "/pages/home.md" });
    }).not.toThrow();
  });

  test("throws when a nested collection directory is registered", () => {
    const registry = createPathRegistry();
    registry.register({ kind: "collection", path: "/posts" });
    expect(() =>
      registry.register({ kind: "collection", path: "/posts/featured" }),
    ).toThrow(/Collection directories overlap/);
  });

  test("throws when a duplicate singleton file is registered", () => {
    const registry = createPathRegistry();
    registry.register({ kind: "singleton", path: "/settings.json" });
    expect(() =>
      registry.register({ kind: "singleton", path: "/settings.json" }),
    ).toThrow(/Two singletons target the same file/);
  });

  test("throws when a singleton file sits inside an existing tree directory", () => {
    const registry = createPathRegistry();
    registry.register({ kind: "tree", path: "/docs" });
    expect(() =>
      registry.register({ kind: "singleton", path: "/docs/preamble.md" }),
    ).toThrow(/sits inside tree directory/);
  });

  test("each registry is independent", () => {
    const a = createPathRegistry();
    const b = createPathRegistry();
    a.register({ kind: "collection", path: "/posts" });
    expect(() =>
      b.register({ kind: "collection", path: "/posts" }),
    ).not.toThrow();
  });
});
