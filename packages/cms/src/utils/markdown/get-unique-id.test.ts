import { expect, test } from "vitest";

import { getUniqueId } from "./get-unique-id";

test("returns the base when it's free", () => {
  expect(getUniqueId("a", new Set(["b"]))).toBe("a");
});

test("suffixes the first free number", () => {
  expect(getUniqueId("a", new Set(["a", "a-1"]))).toBe("a-2");
});
