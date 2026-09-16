import { describe, expect, test } from "vitest";

import { generateTypeNames } from "./generate-type-names";

describe("generateTypeNames", () => {
  test("maps each non-empty item to an entry", () => {
    const entries = generateTypeNames([
      { directory: "/posts", slugs: ["hello-world"] },
      { directory: "/docs/v1", slugs: ["intro", "setup"] },
    ]);

    expect(entries).toEqual([
      { directory: "/posts", typeName: "PostSlug", slugs: ["hello-world"] },
      {
        directory: "/docs/v1",
        typeName: "DocsV1Slug",
        slugs: ["intro", "setup"],
      },
    ]);
  });

  test("omits items with no slugs", () => {
    const entries = generateTypeNames([
      { directory: "/posts", slugs: ["hello-world"] },
      { directory: "/empty", slugs: [] },
    ]);

    expect(entries).toEqual([
      { directory: "/posts", typeName: "PostSlug", slugs: ["hello-world"] },
    ]);
  });

  test("disambiguates colliding type names across items", () => {
    const entries = generateTypeNames([
      { directory: "/post", slugs: ["a"] },
      { directory: "/posts", slugs: ["b"] },
    ]);

    expect(entries.map((entry) => entry.typeName)).toEqual([
      "PostSlug",
      "Post2Slug",
    ]);
  });

  test("returns an empty array when every item is empty", () => {
    expect(generateTypeNames([{ directory: "/empty", slugs: [] }])).toEqual([]);
  });
});
