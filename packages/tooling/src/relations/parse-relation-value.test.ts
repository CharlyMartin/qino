import { describe, expect, test } from "vitest";

import { parseRelationValue } from "./parse-relation-value";

const options = {
  contentFolder: "apps/web/src/content",
  owner: 'Relation "author" in posts/hello.json',
};
const authors = {
  kind: "collection",
  directory: "authors",
  extension: ".json",
} as const;

describe("parseRelationValue", () => {
  test("throws with a fix-it hint on a leading slash", () => {
    expect(() =>
      parseRelationValue("/authors/jane.json", authors, options),
    ).toThrow(
      'Relation "author" in posts/hello.json: value "/authors/jane.json" must be relative to contentFolder, without a leading "/". Use "authors/jane.json".',
    );
  });

  describe("item target", () => {
    const site = { kind: "item", file: "site/config.json" } as const;

    test("returns the value when it matches the item file", () => {
      expect(parseRelationValue("site/config.json", site, options)).toBe(
        "site/config.json",
      );
    });

    test("accepts a root path through the content folder", () => {
      expect(
        parseRelationValue(
          "apps/web/src/content/site/config.json",
          site,
          options,
        ),
      ).toBe("site/config.json");
    });

    test("throws when the value does not match the item file", () => {
      expect(() =>
        parseRelationValue("site/other.json", site, options),
      ).toThrow(
        'Relation "author" in posts/hello.json: expected value "site/config.json" (target item "site/config.json"), got "site/other.json".',
      );
    });
  });

  describe("collection target", () => {
    test("returns the slug with prefix and extension stripped", () => {
      expect(parseRelationValue("authors/jane.json", authors, options)).toBe(
        "jane",
      );
    });

    test.each([
      "src/content/authors/jane.json",
      "web/src/content/authors/jane.json",
      "apps/web/src/content/authors/jane.json",
    ])("accepts the root path %s", (value) => {
      expect(parseRelationValue(value, authors, options)).toBe("jane");
    });

    test("preserves nested slug segments", () => {
      expect(
        parseRelationValue("authors/staff/jane.json", authors, options),
      ).toBe("staff/jane");
    });

    test("throws when the value is not under the collection directory", () => {
      expect(() =>
        parseRelationValue("posts/jane.json", authors, options),
      ).toThrow(
        'Relation "author" in posts/hello.json: expected value under "authors/" (target collection "authors"), got "posts/jane.json".',
      );
    });

    test("throws when a root path does not go through the content folder", () => {
      expect(() =>
        parseRelationValue("other/content/authors/jane.json", authors, options),
      ).toThrow(/expected value under "authors\/"/);
    });

    test("throws when the value does not end with the extension", () => {
      expect(() =>
        parseRelationValue("authors/jane.md", authors, options),
      ).toThrow(
        'Relation "author" in posts/hello.json: expected value ending with ".json" (target collection "authors"), got "authors/jane.md".',
      );
    });
  });

  describe("content root target", () => {
    const root = {
      kind: "collection",
      directory: ".",
      extension: ".json",
    } as const;

    test.each(["jane.json", "src/content/jane.json"])(
      "returns the slug for %s",
      (value) => {
        expect(parseRelationValue(value, root, options)).toBe("jane");
      },
    );
  });

  describe("tree target", () => {
    const docs = { kind: "tree", directory: "docs", extension: ".md" } as const;

    test.each(["docs/guides/setup.md", "src/content/docs/guides/setup.md"])(
      "preserves the nested slug in %s",
      (value) => {
        expect(parseRelationValue(value, docs, options)).toBe("guides/setup");
      },
    );

    test.each(["setup", "other/setup.md", "docs/setup.json"])(
      "rejects the invalid value %s with the tree",
      (value) => {
        expect(() => parseRelationValue(value, docs, options)).toThrow(
          /in posts\/hello\.json.*target tree "docs"/,
        );
      },
    );
  });

  test("reads a content folder at the repository root", () => {
    expect(
      parseRelationValue("authors/jane.json", authors, {
        ...options,
        contentFolder: ".",
      }),
    ).toBe("jane");
  });
});
