import { describe, expect, test } from "vitest";

import { collectStrings } from "./collect-strings";

describe("collectStrings", () => {
  test("collects nested strings from objects and arrays", () => {
    expect(
      collectStrings({
        title: "Hi",
        count: 2,
        cover: { src: "/a.png" },
        gallery: ["/b.png", { src: "/c.png" }],
        empty: null,
      }),
    ).toEqual(["Hi", "/a.png", "/b.png", "/c.png"]);
  });

  test("returns an empty array for non-string scalars", () => {
    expect(collectStrings(42)).toEqual([]);
    expect(collectStrings(undefined)).toEqual([]);
  });
});
