import { describe, expect, test } from "vitest";

import { paginate } from "./paginate";

const owner = 'Collection "posts" (view "default")';
const items = ["a", "b", "c", "d", "e"];

describe("paginate", () => {
  test("slices full pages and a partial last page", () => {
    expect(paginate(items, { page: 1, perPage: 2, owner })).toEqual({
      entries: ["a", "b"],
      page: 1,
      perPage: 2,
      pageCount: 3,
      total: 5,
    });
    expect(paginate(items, { page: 3, perPage: 2, owner })).toMatchObject({
      entries: ["e"],
      pageCount: 3,
    });
  });

  test("fits every item on one page when perPage exceeds the total", () => {
    expect(paginate(items, { page: 1, perPage: 10, owner })).toMatchObject({
      entries: items,
      pageCount: 1,
    });
  });

  test("keeps page 1 for an empty list", () => {
    expect(paginate([], { page: 1, perPage: 10, owner })).toEqual({
      entries: [],
      page: 1,
      perPage: 10,
      pageCount: 1,
      total: 0,
    });
  });

  test("throws for a page past the last one", () => {
    expect(() => paginate(items, { page: 4, perPage: 2, owner })).toThrow(
      'Collection "posts" (view "default"): page 4 is out of range, expected 1 to 3.',
    );
    expect(() => paginate([], { page: 2, perPage: 10, owner })).toThrow(
      /page 2 is out of range, expected 1 to 1/,
    );
  });

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s as page or perPage",
    (value) => {
      expect(() => paginate(items, { page: value, perPage: 2, owner })).toThrow(
        `${owner}: page must be a positive integer, got ${value}.`,
      );
      expect(() => paginate(items, { page: 1, perPage: value, owner })).toThrow(
        `${owner}: perPage must be a positive integer, got ${value}.`,
      );
    },
  );

  test("names a string or missing value from a JavaScript caller", () => {
    expect(() =>
      paginate(items, { page: "2" as never, perPage: 2, owner }),
    ).toThrow(`${owner}: page must be a positive integer, got "2".`);
    expect(() =>
      paginate(items, { page: 1, perPage: undefined as never, owner }),
    ).toThrow(`${owner}: perPage must be a positive integer, got undefined.`);
  });

  test("does not change the input", () => {
    const input = [...items];
    paginate(input, { page: 2, perPage: 2, owner });
    expect(input).toEqual(items);
  });
});
