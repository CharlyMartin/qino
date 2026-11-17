import { describe, expect, test } from "vitest";

import { assertPageOptions } from "./assert-page-options";

const owner = 'Collection "posts" (view "default")';

describe("assertPageOptions", () => {
  test("accepts positive integers", () => {
    expect(() =>
      assertPageOptions({ page: 1, perPage: 1, owner }),
    ).not.toThrow();
    expect(() =>
      assertPageOptions({ page: 500, perPage: 24, owner }),
    ).not.toThrow();
  });

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s as page or perPage",
    (value) => {
      expect(() =>
        assertPageOptions({ page: value, perPage: 2, owner }),
      ).toThrow(`${owner}: page must be a positive integer, got ${value}.`);
      expect(() =>
        assertPageOptions({ page: 1, perPage: value, owner }),
      ).toThrow(`${owner}: perPage must be a positive integer, got ${value}.`);
    },
  );

  test("names a string or missing value from a JavaScript caller", () => {
    expect(() =>
      assertPageOptions({ page: "2" as never, perPage: 2, owner }),
    ).toThrow(`${owner}: page must be a positive integer, got "2".`);
    expect(() =>
      assertPageOptions({ page: 1, perPage: undefined as never, owner }),
    ).toThrow(`${owner}: perPage must be a positive integer, got undefined.`);
  });
});
