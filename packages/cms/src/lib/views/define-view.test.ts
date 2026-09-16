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
    resolveRelations: false,
    [QinoViewMarker]: true,
  });
  expect(config).not.toHaveProperty("resolveRelations");
  expect(Object.hasOwn(config, QinoViewMarker)).toBe(false);
  expect(callback).not.toHaveBeenCalled();
});

test.each([
  "collection",
  "tree",
  "item",
] as const)("preserves explicit resolution for %s", (primitive) => {
  expect(defineView({ resolveRelations: 2 }, primitive).resolveRelations).toBe(
    2,
  );
});

test.each([
  "tree",
  "item",
] as const)("treats undefined collection-only options as omitted for %s", (primitive) => {
  const omitted = { filter: undefined, sort: undefined };
  expect(defineView({ ...omitted }, primitive).resolveRelations).toBe(false);
});

test.each([
  "tree",
  "item",
] as const)("rejects collection-only options for %s", (primitive) => {
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
});

test.each([
  undefined,
  null,
  [],
  false,
])("rejects invalid view input %s", (config) => {
  expect(() => defineView(config as never, "collection")).toThrow(
    /configuration object/,
  );
});
