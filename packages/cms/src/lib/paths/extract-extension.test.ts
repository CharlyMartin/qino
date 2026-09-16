import { describe, expect, test } from "vitest";

import { extractExtension } from "./extract-extension";

describe("extractExtension", () => {
  test("returns .md for a .md file", () => {
    expect(extractExtension("post.md")).toBe(".md");
  });

  test("returns .mdx for a .mdx file", () => {
    expect(extractExtension("post.mdx")).toBe(".mdx");
  });

  test("returns .markdown for a .markdown file", () => {
    expect(extractExtension("post.markdown")).toBe(".markdown");
  });

  test("returns .json for a .json file", () => {
    expect(extractExtension("data.json")).toBe(".json");
  });

  test("throws for an unsupported extension", () => {
    expect(() => extractExtension("notes.txt")).toThrow(/must end with one of/);
  });

  test("throws for a file with no extension", () => {
    expect(() => extractExtension("README")).toThrow(/must end with one of/);
  });
});
