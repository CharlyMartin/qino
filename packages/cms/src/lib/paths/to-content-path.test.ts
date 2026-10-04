import { describe, expect, test } from "vitest";

import { toContentPath } from "./to-content-path";

const FOLDER = "/repo/apps/site/src/content";

describe("toContentPath", () => {
  test("returns a content path as-is", () => {
    expect(toContentPath("authors/jane.json", FOLDER, "authors/")).toBe(
      "authors/jane.json",
    );
  });

  test.each([
    "src/content/authors/jane.json",
    "site/src/content/authors/jane.json",
    "apps/site/src/content/authors/jane.json",
    "repo/apps/site/src/content/authors/jane.json",
  ])("strips the content folder from the root path %s", (value) => {
    expect(toContentPath(value, FOLDER, "authors/")).toBe("authors/jane.json");
  });

  test("matches an item file through the content folder", () => {
    expect(
      toContentPath("src/content/pages/home.md", FOLDER, "pages/home.md"),
    ).toBe("pages/home.md");
  });

  test("resolves a parent-relative content folder", () => {
    const folder = `${process.cwd()}/../../content`;
    expect(toContentPath("content/authors/jane.json", folder, "authors/")).toBe(
      "authors/jane.json",
    );
  });

  test("resolves a relative content folder against the working directory", () => {
    expect(
      toContentPath(
        "src/content/authors/jane.json",
        "./src/content/",
        "authors/",
      ),
    ).toBe("authors/jane.json");
  });

  test("strips the content folder for a target at the content root", () => {
    expect(toContentPath("src/content/jane.json", FOLDER, "")).toBe(
      "jane.json",
    );
  });

  test("returns a content path for a target at the content root as-is", () => {
    expect(toContentPath("jane.json", FOLDER, "")).toBe("jane.json");
  });

  test("does not match a partial folder segment", () => {
    expect(
      toContentPath("xsrc/content/authors/jane.json", FOLDER, "authors/"),
    ).toBe("xsrc/content/authors/jane.json");
  });

  test("does not match a prefix that is not the content folder", () => {
    expect(
      toContentPath("other/content/authors/jane.json", FOLDER, "authors/"),
    ).toBe("other/content/authors/jane.json");
  });

  test("does not misread a nested folder named like the content folder", () => {
    expect(
      toContentPath("docs/content/setup.md", "/repo/content", "docs/"),
    ).toBe("docs/content/setup.md");
  });
});
