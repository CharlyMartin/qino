import { describe, expect, test } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import {
  makeDummyCollection,
  makeDummySingleton,
  makeDummyTree,
} from "../../utils/tests";
import { parseRelationValue } from "./parse-relation-value";

const ctx = { sourceFilePath: "/fixtures/post.json", relationKey: "author" };

describe("parseRelationValue", () => {
  describe("singleton target", () => {
    test("returns normalized value when it matches meta.file", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(parseRelationValue("/site/config.json", meta, ctx)).toBe(
        "site/config.json",
      );
    });

    test("accepts value without a leading slash", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(parseRelationValue("site/config.json", meta, ctx)).toBe(
        "site/config.json",
      );
    });

    test("throws when value does not match the singleton file", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(() => parseRelationValue("/site/other.json", meta, ctx)).toThrow(
        /author.*post\.json.*expected value/,
      );
    });
  });

  describe("collection target", () => {
    test("returns the slug with prefix and extension stripped", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue("/authors/jane.json", meta, ctx)).toBe("jane");
    });

    test("accepts value without a leading slash", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue("authors/jane.json", meta, ctx)).toBe("jane");
    });

    test("preserves nested slug segments", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue("/authors/staff/jane.json", meta, ctx)).toBe(
        "staff/jane",
      );
    });

    test("throws when value is not under the collection directory", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(() => parseRelationValue("/posts/jane.json", meta, ctx)).toThrow(
        /expected value under "authors\/"/,
      );
    });

    test("throws when value does not end with the expected extension", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(() => parseRelationValue("/authors/jane.md", meta, ctx)).toThrow(
        /expected value ending with "\.json"/,
      );
    });
  });
});

describe("tree target", () => {
  const meta = makeDummyTree({ directory: "/docs", extension: ".md" })[
    QinoPrimitiveMarker
  ];

  test.each([
    "docs/guides/setup.md",
    "/docs/guides/setup.md",
  ])("preserves the nested slug in %s", (value) => {
    expect(parseRelationValue(value, meta, ctx)).toBe("guides/setup");
  });

  test.each([
    "setup",
    "other/setup.md",
    "docs/setup.json",
  ])("rejects invalid reference %s with tree and source context", (value) => {
    expect(() => parseRelationValue(value, meta, ctx)).toThrow(
      /author.*post\.json.*target tree "\/docs"/,
    );
  });
});
