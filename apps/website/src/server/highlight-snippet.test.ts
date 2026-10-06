import { expect, test } from "vitest";

import { highlightSnippet } from "./highlight-snippet";

test("highlights the fenced code with highlight.js classes", () => {
  const html = highlightSnippet('```ts\nconst a = "b"\n```\n');

  expect(html).toContain('<span class="hljs-keyword">const</span>');
  expect(html).toContain('<span class="hljs-string">&quot;b&quot;</span>');
  expect(html).not.toContain("```");
});

test("keeps the fence meta out of the code", () => {
  expect(highlightSnippet('```ts title="a.ts"\nlet a\n```')).not.toContain(
    "title",
  );
});

test("throws without a fenced block or language", () => {
  expect(() => highlightSnippet("const a = 1")).toThrow();
  expect(() => highlightSnippet("```\nconst a = 1\n```")).toThrow();
});
