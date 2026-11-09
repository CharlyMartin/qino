import { describe, expect, test } from "vitest";

import { assertViewResolveDepth } from "./assert-view-resolve-depth";

describe("assertViewResolveDepth", () => {
  const relations = { author: {} as never, "tags[*]": {} as never };

  test("accepts depths by relation path, including undefined ones", () => {
    for (const resolveDepth of [
      {},
      { author: 0, "tags[*]": 6 },
      { author: undefined },
    ]) {
      expect(() =>
        assertViewResolveDepth("detail", resolveDepth, relations),
      ).not.toThrow();
    }
  });

  test("rejects a path that isn't a relation, naming the relations", () => {
    expect(() =>
      assertViewResolveDepth("detail", { autor: 1 }, relations),
    ).toThrow(
      'View "detail": resolveDepth sets "autor", which isn\'t a relation. Relations: author, tags[*].',
    );
    expect(() =>
      assertViewResolveDepth("detail", { toString: 1 }, relations),
    ).toThrow(/isn't a relation/);
    expect(() => assertViewResolveDepth("detail", { author: 1 }, {})).toThrow(
      /Relations: \(none\)\./,
    );
  });

  test.each([-1, 7, 1.5, Number.NaN, "2", null, true])(
    "rejects the depth %s",
    (depth) => {
      expect(() =>
        assertViewResolveDepth("detail", { author: depth }, relations),
      ).toThrow(/resolveDepth of "author" must be a whole number from 0 to 6/);
    },
  );

  test.each([true, false, 2, [], null, undefined])(
    "rejects a non-object resolveDepth %s",
    (resolveDepth) => {
      expect(() =>
        assertViewResolveDepth("detail", resolveDepth, relations),
      ).toThrow(/resolveDepth must be an object of depths by relation path/);
    },
  );
});
