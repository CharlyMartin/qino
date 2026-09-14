import { describe, expect, test } from "vitest";

import { describePathConflict } from "./describe-path-conflict";

describe("describePathConflict", () => {
  test("returns null for disjoint paths of any kind", () => {
    expect(
      describePathConflict(
        { kind: "collection", path: "/authors" },
        { kind: "tree", path: "/docs" },
      ),
    ).toBeNull();
    expect(
      describePathConflict(
        { kind: "item", path: "/pages/home.md" },
        { kind: "collection", path: "/authors" },
      ),
    ).toBeNull();
  });

  test("flags overlapping collection directories", () => {
    expect(
      describePathConflict(
        { kind: "collection", path: "/posts" },
        { kind: "collection", path: "/posts/featured" },
      ),
    ).toMatch(/Collection directories overlap.*\/posts.*\/posts\/featured/);
  });

  test("flags equal collection directories", () => {
    expect(
      describePathConflict(
        { kind: "collection", path: "/posts" },
        { kind: "collection", path: "/posts" },
      ),
    ).toMatch(/Collection directories overlap/);
  });

  test("flags nested tree directories", () => {
    expect(
      describePathConflict(
        { kind: "tree", path: "/docs" },
        { kind: "tree", path: "/docs/api" },
      ),
    ).toMatch(/Tree directories overlap.*\/docs.*\/docs\/api/);
  });

  test("flags items targeting the same file", () => {
    expect(
      describePathConflict(
        { kind: "item", path: "/settings.json" },
        { kind: "item", path: "/settings.json" },
      ),
    ).toMatch(/Two items target the same file.*\/settings\.json/);
  });

  test("flags tree directory overlapping a collection directory regardless of arg order", () => {
    const message = /Tree directory "\/docs" overlaps with collection/;
    expect(
      describePathConflict(
        { kind: "tree", path: "/docs" },
        { kind: "collection", path: "/docs/api" },
      ),
    ).toMatch(message);
    expect(
      describePathConflict(
        { kind: "collection", path: "/docs/api" },
        { kind: "tree", path: "/docs" },
      ),
    ).toMatch(message);
  });

  test("flags an item file inside a tree directory", () => {
    expect(
      describePathConflict(
        { kind: "item", path: "/docs/preamble.md" },
        { kind: "tree", path: "/docs" },
      ),
    ).toMatch(
      /Item file "\/docs\/preamble\.md" sits inside tree directory "\/docs"/,
    );
  });

  test("flags an item file inside a collection directory", () => {
    expect(
      describePathConflict(
        { kind: "item", path: "/posts/intro.md" },
        { kind: "collection", path: "/posts" },
      ),
    ).toMatch(
      /Item file "\/posts\/intro\.md" sits inside collection directory "\/posts"/,
    );
  });

  test("allows an item sharing a prefix but not inside the tree", () => {
    expect(
      describePathConflict(
        { kind: "item", path: "/docs-extra.md" },
        { kind: "tree", path: "/docs" },
      ),
    ).toBeNull();
  });
});
