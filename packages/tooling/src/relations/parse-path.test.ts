import { describe, expect, test } from "vitest";

import { parsePath } from "./parse-path";

describe("parsePath", () => {
  test("top-level key", () => {
    expect(parsePath("author")).toEqual([{ kind: "key", name: "author" }]);
  });

  test("top-level array of strings", () => {
    expect(parsePath("categories[*]")).toEqual([
      { kind: "key", name: "categories" },
      { kind: "array" },
    ]);
  });

  test("nested key", () => {
    expect(parsePath("test.foo.bar")).toEqual([
      { kind: "key", name: "test" },
      { kind: "key", name: "foo" },
      { kind: "key", name: "bar" },
    ]);
  });

  test("nested array of strings", () => {
    expect(parsePath("test.coco[*]")).toEqual([
      { kind: "key", name: "test" },
      { kind: "key", name: "coco" },
      { kind: "array" },
    ]);
  });

  test("array of objects with leaf", () => {
    expect(parsePath("articles[*].author")).toEqual([
      { kind: "key", name: "articles" },
      { kind: "array" },
      { kind: "key", name: "author" },
    ]);
  });

  test("rejects empty path", () => {
    expect(() => parsePath("")).toThrow(/empty/i);
  });

  test("rejects empty segment", () => {
    expect(() => parsePath("a..b")).toThrow(/empty segment/i);
  });

  test("rejects bare [*]", () => {
    expect(() => parsePath("[*]")).toThrow(/bare/i);
  });
});
