import { describe, expect, test } from "vitest";

import { QinoMeta } from "../../data/globals";
import { makeDummyCollection, makeDummySingleton } from "../../utils/tests";
import { parseRelationValue } from "./parse-relation-value";

const ctx = { sourceFilePath: "/fixtures/post.json", relationKey: "author" };

describe("parseRelationValue", () => {
  describe("singleton target", () => {
    test("returns normalized value when it matches meta.file", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[QinoMeta];
      expect(parseRelationValue("/site/config.json", meta, ctx)).toBe(
        "site/config.json",
      );
    });

    test("accepts value without a leading slash", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[QinoMeta];
      expect(parseRelationValue("site/config.json", meta, ctx)).toBe(
        "site/config.json",
      );
    });

    test("throws when value does not match the singleton file", () => {
      const meta = makeDummySingleton({ file: "/site/config.json" })[QinoMeta];
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
      })[QinoMeta];
      expect(parseRelationValue("/authors/jane.json", meta, ctx)).toBe("jane");
    });

    test("accepts value without a leading slash", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoMeta];
      expect(parseRelationValue("authors/jane.json", meta, ctx)).toBe("jane");
    });

    test("preserves nested slug segments", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoMeta];
      expect(parseRelationValue("/authors/staff/jane.json", meta, ctx)).toBe(
        "staff/jane",
      );
    });

    test("throws when value is not under the collection directory", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoMeta];
      expect(() => parseRelationValue("/posts/jane.json", meta, ctx)).toThrow(
        /expected value under "authors\/"/,
      );
    });

    test("throws when value does not end with the expected extension", () => {
      const meta = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      })[QinoMeta];
      expect(() => parseRelationValue("/authors/jane.md", meta, ctx)).toThrow(
        /expected value ending with "\.json"/,
      );
    });
  });
});
