import { describe, expect, test } from "vitest";

import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import { normalizeResolveOption } from "./normalize-resolve-option";

describe("normalizeResolveOption", () => {
  test("true uses each relation's own depth", () => {
    expect(normalizeResolveOption(true)).toEqual({
      depth: MAX_RESOLVE_DEPTH,
      override: false,
    });
  });

  test("false resolves nothing", () => {
    expect(normalizeResolveOption(false)).toEqual({ depth: 0, override: true });
  });

  test("{ depth } overrides every relation", () => {
    expect(normalizeResolveOption({ depth: 3 })).toEqual({
      depth: 3,
      override: true,
    });
  });

  test("accepts depth 0", () => {
    expect(normalizeResolveOption({ depth: 0 })).toEqual({
      depth: 0,
      override: true,
    });
  });

  test("clamps depths above MAX_RESOLVE_DEPTH", () => {
    expect(
      normalizeResolveOption({ depth: (MAX_RESOLVE_DEPTH + 5) as 1 }).depth,
    ).toBe(MAX_RESOLVE_DEPTH);
  });

  test("clamps negative depths to 0", () => {
    expect(normalizeResolveOption({ depth: -2 as 1 }).depth).toBe(0);
  });

  test("floors fractional depths", () => {
    expect(normalizeResolveOption({ depth: 2.9 as 2 }).depth).toBe(2);
  });
});
