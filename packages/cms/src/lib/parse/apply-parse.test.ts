import { describe, expect, test, vi } from "vitest";

import { applyParse } from "./apply-parse";

const owner = 'Relation "author" in posts/a.md';

describe("applyParse", () => {
  test("keeps the value without a parse callback", () => {
    expect(applyParse({ value: "a", parse: undefined, ctx: {}, owner })).toBe(
      "a",
    );
  });

  test("replaces the value with the returned string", () => {
    const parse = vi.fn((value: string) => value.toUpperCase());
    const ctx = { fieldPath: "author" };

    expect(applyParse({ value: "a", parse, ctx, owner })).toBe("A");
    expect(parse).toHaveBeenCalledWith("a", ctx);
  });

  test.each([undefined, null])(
    "keeps the value when parse returns %s",
    (result) => {
      expect(
        applyParse({
          value: "a",
          parse: () => result as never,
          ctx: {},
          owner,
        }),
      ).toBe("a");
    },
  );

  test("rejects a return value that isn't a string", () => {
    expect(() =>
      applyParse({ value: "a", parse: () => 42 as never, ctx: {}, owner }),
    ).toThrow(
      'Relation "author" in posts/a.md: parse must return a string or undefined, got number for "a".',
    );
  });

  test("names the field and value when parse throws", () => {
    expect(() =>
      applyParse({
        value: "[[Jane]]",
        parse: () => {
          throw new Error("no such note");
        },
        ctx: {},
        owner,
      }),
    ).toThrow(
      'Relation "author" in posts/a.md: parse failed for "[[Jane]]": no such note',
    );
  });
});
