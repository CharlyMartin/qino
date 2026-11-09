import { expect, test, vi } from "vitest";

import { QinoViewMarker } from "../../data/globals";
import { defineView } from "./define-view";

test("constructs a marked view without mutating config or running callbacks", () => {
  const callback = vi.fn(() => {
    throw new Error("Must not run at creation");
  });
  const config = { augment: callback, filter: callback, sort: callback };
  expect(defineView(config, "collection")).toEqual({
    ...config,
    resolveDepth: {},
    [QinoViewMarker]: true,
  });
  expect(config).not.toHaveProperty("resolveDepth");
  expect(Object.hasOwn(config, QinoViewMarker)).toBe(false);
  expect(callback).not.toHaveBeenCalled();
});

test.each(["collection", "tree", "item"] as const)(
  "preserves explicit depths for %s",
  (primitive) => {
    expect(
      defineView({ resolveDepth: { author: 2 } }, primitive).resolveDepth,
    ).toEqual({ author: 2 });
  },
);

test("rejects resolveRelations with a pointer to resolveDepth", () => {
  for (const value of [true, false, { depth: 2 }]) {
    expect(() =>
      defineView({ resolveRelations: value } as never, "collection"),
    ).toThrow(/no longer takes resolveRelations.*resolveDepth/);
  }
});

test.each(["tree", "item"] as const)(
  "treats undefined collection-only options as omitted for %s",
  (primitive) => {
    const omitted = { filter: undefined, sort: undefined };
    expect(defineView({ ...omitted }, primitive).resolveDepth).toEqual({});
  },
);

test.each(["tree", "item"] as const)(
  "rejects collection-only options for %s",
  (primitive) => {
    for (const config of [
      { filter: () => true },
      { sort: () => 0 },
      { filter: null } as never,
      { sort: null } as never,
    ]) {
      expect(() => defineView(config, primitive)).toThrow(
        /do not support filter or sort/,
      );
    }
  },
);

test.each([undefined, null, [], false])(
  "rejects invalid view input %s",
  (config) => {
    expect(() => defineView(config as never, "collection")).toThrow(
      /configuration object/,
    );
  },
);
