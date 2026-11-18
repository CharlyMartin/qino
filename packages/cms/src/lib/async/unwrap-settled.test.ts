import { describe, expect, test } from "vitest";

import { unwrapSettled } from "./unwrap-settled";

describe("unwrapSettled", () => {
  test("returns every value in order when all are fulfilled", async () => {
    const results = await Promise.allSettled([
      Promise.resolve("a"),
      Promise.resolve("b"),
    ]);

    expect(unwrapSettled(results)).toEqual(["a", "b"]);
  });

  test("throws the first rejection in order, not the first to settle", async () => {
    const first = new Error("first");
    const second = new Error("second");
    const results = await Promise.allSettled([
      Promise.resolve("a"),
      new Promise((_, reject) => setTimeout(() => reject(first), 20)),
      Promise.reject(second),
    ]);

    expect(() => unwrapSettled(results)).toThrow(first);
  });

  test("returns an empty array for no results", () => {
    expect(unwrapSettled([])).toEqual([]);
  });
});
