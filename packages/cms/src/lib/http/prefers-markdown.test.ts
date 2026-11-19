import { describe, expect, test } from "vitest";

import { prefersMarkdown } from "./prefers-markdown";

describe("prefersMarkdown", () => {
  test("prefers HTML when it has the higher q-value", () => {
    expect(prefersMarkdown("text/html;q=1, text/markdown;q=0.5")).toBe(false);
  });

  test("counts wildcards toward HTML, the default", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, */*")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0.5, text/*")).toBe(false);
  });

  test("breaks a tie in favor of the type listed first", () => {
    expect(prefersMarkdown("text/markdown, text/html, */*")).toBe(true);
    expect(prefersMarkdown("text/html, text/markdown")).toBe(false);
  });

  test("breaks a tie in favor of a named type over a wildcard", () => {
    expect(prefersMarkdown("*/*, text/markdown")).toBe(true);
    expect(prefersMarkdown("text/*, text/markdown")).toBe(true);
    expect(prefersMarkdown("*/*, text/markdown, text/html")).toBe(true);
  });

  test("accepts text/x-markdown as an alias", () => {
    expect(prefersMarkdown("text/x-markdown, text/html;q=0.9")).toBe(true);
  });

  test("prefers HTML unless Markdown is named with a q-value above 0", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(prefersMarkdown("text/*")).toBe(false);
    expect(prefersMarkdown("text/plain")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0, text/html")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=oops")).toBe(false);
  });

  test("prefers Markdown named on its own", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown; q=0.5")).toBe(true);
  });

  test("ignores case in types and parameter names", () => {
    expect(prefersMarkdown("Text/Markdown, text/html;Q=0.5")).toBe(true);
  });

  test("reads a q-value with spaces around the equals sign", () => {
    expect(prefersMarkdown("text/html;q=0.9, text/markdown;q = 0.5")).toBe(
      false,
    );
  });

  test("caps q-values at 1", () => {
    expect(prefersMarkdown("text/html, text/markdown;q=1.5")).toBe(false);
  });

  test("ignores a range whose q-value can't be read", () => {
    expect(prefersMarkdown("text/markdown, text/html;q=oops")).toBe(true);
  });
});
