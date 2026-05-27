import { describe, expect, test } from "vitest";

import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import { normalizeDepth } from "./normalize-depth";

describe("normalizeDepth", () => {
  test("true returns MAX_RESOLVE_DEPTH", () => {
    expect(normalizeDepth(true)).toBe(MAX_RESOLVE_DEPTH);
  });

  test("false returns 0", () => {
    expect(normalizeDepth(false)).toBe(0);
  });

  test("number within range returns the number", () => {
    expect(normalizeDepth(3)).toBe(3);
  });

  test("clamps numbers above MAX_RESOLVE_DEPTH", () => {
    expect(normalizeDepth((MAX_RESOLVE_DEPTH + 5) as 1)).toBe(
      MAX_RESOLVE_DEPTH,
    );
  });

  test("clamps negative numbers to 0", () => {
    expect(normalizeDepth(-2 as 1)).toBe(0);
  });

  test("floors fractional numbers", () => {
    expect(normalizeDepth(2.9 as 2)).toBe(2);
  });

  test("accepts 0", () => {
    expect(normalizeDepth(0 as 1)).toBe(0);
  });

  test("accepts MAX_RESOLVE_DEPTH", () => {
    expect(normalizeDepth(MAX_RESOLVE_DEPTH)).toBe(MAX_RESOLVE_DEPTH);
  });

  test("true returns the custom depth when provided", () => {
    expect(normalizeDepth(true, 2)).toBe(2);
  });

  test("clamps numbers above the custom depth", () => {
    expect(normalizeDepth(5 as 1, 3)).toBe(3);
  });

  test("number within the custom depth returns the number", () => {
    expect(normalizeDepth(2, 4)).toBe(2);
  });

  test("false returns 0 even with a custom depth", () => {
    expect(normalizeDepth(false, 4)).toBe(0);
  });
});
