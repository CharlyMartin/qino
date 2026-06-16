import { describe, expect, test } from "vitest";

import { getCollisionFreeTypeName } from "./get-collision-free-type-name";

describe("getCollisionFreeTypeName", () => {
  test("returns the base name when there is no collision", () => {
    expect(getCollisionFreeTypeName("/posts", new Set())).toBe("PostSlug");
  });

  test("suffixes a singular/plural collision (`/post` vs `/posts`)", () => {
    const usedNames = new Set<string>();

    expect(getCollisionFreeTypeName("/post", usedNames)).toBe("PostSlug");
    expect(getCollisionFreeTypeName("/posts", usedNames)).toBe("Post2Slug");
  });

  test("suffixes a separator collision (`/a-b` vs `/a/b`)", () => {
    const usedNames = new Set<string>();

    expect(getCollisionFreeTypeName("/a-b", usedNames)).toBe("ABSlug");
    expect(getCollisionFreeTypeName("/a/b", usedNames)).toBe("AB2Slug");
  });

  test("increments the suffix for a three-way clash", () => {
    const usedNames = new Set<string>();

    expect(getCollisionFreeTypeName("/post", usedNames)).toBe("PostSlug");
    expect(getCollisionFreeTypeName("/posts", usedNames)).toBe("Post2Slug");
    expect(getCollisionFreeTypeName("/post", usedNames)).toBe("Post3Slug");
  });

  test("adds the chosen name to the passed set", () => {
    const usedNames = new Set<string>();

    getCollisionFreeTypeName("/posts", usedNames);

    expect(usedNames.has("PostSlug")).toBe(true);
  });
});
