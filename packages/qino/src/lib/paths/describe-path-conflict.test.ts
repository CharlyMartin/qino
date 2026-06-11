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
        { kind: "singleton", path: "/pages/home.md" },
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

  test("flags singletons targeting the same file", () => {
    expect(
      describePathConflict(
        { kind: "singleton", path: "/settings.json" },
        { kind: "singleton", path: "/settings.json" },
      ),
    ).toMatch(/Two singletons target the same file.*\/settings\.json/);
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

  test("flags a singleton file inside a tree directory", () => {
    expect(
      describePathConflict(
        { kind: "singleton", path: "/docs/preamble.md" },
        { kind: "tree", path: "/docs" },
      ),
    ).toMatch(
      /Singleton file "\/docs\/preamble\.md" sits inside tree directory "\/docs"/,
    );
  });

  test("flags a singleton file inside a collection directory", () => {
    expect(
      describePathConflict(
        { kind: "singleton", path: "/posts/intro.md" },
        { kind: "collection", path: "/posts" },
      ),
    ).toMatch(
      /Singleton file "\/posts\/intro\.md" sits inside collection directory "\/posts"/,
    );
  });

  test("allows a singleton sharing a prefix but not inside the tree", () => {
    expect(
      describePathConflict(
        { kind: "singleton", path: "/docs-extra.md" },
        { kind: "tree", path: "/docs" },
      ),
    ).toBeNull();
  });
});
