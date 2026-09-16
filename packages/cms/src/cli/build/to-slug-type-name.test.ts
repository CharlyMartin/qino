import { describe, expect, test } from "vitest";

import { toSlugTypeName } from "./to-slug-type-name";

describe("toSlugTypeName", () => {
  test("singularizes a plural leaf segment", () => {
    expect(toSlugTypeName("/posts")).toBe("PostSlug");
    expect(toSlugTypeName("/categories")).toBe("CategorySlug");
  });

  test("leaves an already-singular name untouched", () => {
    expect(toSlugTypeName("/blog")).toBe("BlogSlug");
  });

  test("builds the name from the full path, singularizing only the leaf", () => {
    expect(toSlugTypeName("/blog/posts")).toBe("BlogPostSlug");
    expect(toSlugTypeName("/docs/v1")).toBe("DocsV1Slug");
  });

  test("throws when the path has no usable segments", () => {
    expect(() => toSlugTypeName("/")).toThrow();
    expect(() => toSlugTypeName("")).toThrow();
  });
});
