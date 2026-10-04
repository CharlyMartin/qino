import { describe, expect, test } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { parseRelationValue } from "./parse-relation-value";

const ctx = { sourceFilePath: "/fixtures/post.json", relationKey: "author" };

describe("parseRelationValue", () => {
  test("throws with a fix-it hint on a leading slash", () => {
    const meta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    expect(() => parseRelationValue("/authors/jane.json", meta, ctx)).toThrow(
      'Relation "author" in /fixtures/post.json: value "/authors/jane.json" must be relative to contentFolder, without a leading "/". Use "authors/jane.json".',
    );
  });

  describe("item target", () => {
    test("returns the value when it matches meta.file", () => {
      const meta = makeDummyItem({ file: "site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(parseRelationValue("site/config.json", meta, ctx)).toBe(
        "site/config.json",
      );
    });

    test("accepts a root path through the content folder", () => {
      const meta = makeDummyItem({ file: "site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(
        parseRelationValue("apps/web/src/content/site/config.json", meta, ctx),
      ).toBe("site/config.json");
    });

    test("throws when value does not match the item file", () => {
      const meta = makeDummyItem({ file: "site/config.json" })[
        QinoPrimitiveMarker
      ];
      expect(() => parseRelationValue("site/other.json", meta, ctx)).toThrow(
        /author.*post\.json.*expected value/,
      );
    });
  });

  describe("collection target", () => {
    test("returns the slug with prefix and extension stripped", () => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue("authors/jane.json", meta, ctx)).toBe("jane");
    });

    test.each([
      "src/content/authors/jane.json",
      "apps/web/src/content/authors/jane.json",
    ])("accepts the root path %s", (value) => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue(value, meta, ctx)).toBe("jane");
    });

    test("preserves nested slug segments", () => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(parseRelationValue("authors/staff/jane.json", meta, ctx)).toBe(
        "staff/jane",
      );
    });

    test("throws when value is not under the collection directory", () => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(() => parseRelationValue("posts/jane.json", meta, ctx)).toThrow(
        /expected value under "authors\/"/,
      );
    });

    test("throws when a root path does not go through the content folder", () => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(() =>
        parseRelationValue("other/content/authors/jane.json", meta, ctx),
      ).toThrow(/expected value under "authors\/"/);
    });

    test("throws when value does not end with the expected extension", () => {
      const meta = makeDummyCollection({
        directory: "authors",
        extension: ".json",
      })[QinoPrimitiveMarker];
      expect(() => parseRelationValue("authors/jane.md", meta, ctx)).toThrow(
        /expected value ending with "\.json"/,
      );
    });
  });
});

describe("content root target", () => {
  const meta = makeDummyCollection({ directory: "", extension: ".json" })[
    QinoPrimitiveMarker
  ];

  test.each(["jane.json", "src/content/jane.json"])(
    "returns the slug for %s",
    (value) => {
      expect(parseRelationValue(value, meta, ctx)).toBe("jane");
    },
  );
});

describe("tree target", () => {
  const meta = makeDummyTree({ directory: "docs", extension: ".md" })[
    QinoPrimitiveMarker
  ];

  test.each(["docs/guides/setup.md", "src/content/docs/guides/setup.md"])(
    "preserves the nested slug in %s",
    (value) => {
      expect(parseRelationValue(value, meta, ctx)).toBe("guides/setup");
    },
  );

  test.each(["setup", "other/setup.md", "docs/setup.json"])(
    "rejects invalid reference %s with tree and source context",
    (value) => {
      expect(() => parseRelationValue(value, meta, ctx)).toThrow(
        /author.*post\.json.*target tree "docs"/,
      );
    },
  );
});
