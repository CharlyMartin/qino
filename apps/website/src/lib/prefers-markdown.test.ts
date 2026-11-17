import { expect, test } from "vitest";

import { prefersMarkdown } from "./prefers-markdown";

// Test vectors from https://acceptmarkdown.com/guides/accept-parsing, plus agent headers.
test.each([
  "text/markdown",
  "text/markdown, text/html;q=0.8",
  "text/markdown, text/html, */*",
  "text/markdown, */*",
  "text/*, text/markdown",
  "text/html;q=0.5, text/markdown;q=0.9",
  "Text/Markdown",
  "text/markdown; charset=utf-8",
  "*/*;q=0.1, text/markdown",
])("serves Markdown for %s", (accept) => {
  expect(prefersMarkdown(accept)).toBe(true);
});

test.each([
  "text/html",
  "text/markdown;q=0, text/html",
  "text/markdown;q=0",
  "text/markdown;q=0.9, text/html",
  "text/html, text/markdown",
  "*/*",
  "text/*",
  "text/markdown;q=0, */*",
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "application/json",
  "text/markdown;q=abc",
  "",
])("serves HTML for %j", (accept) => {
  expect(prefersMarkdown(accept)).toBe(false);
});

test("serves HTML without an Accept header", () => {
  expect(prefersMarkdown(null)).toBe(false);
});
