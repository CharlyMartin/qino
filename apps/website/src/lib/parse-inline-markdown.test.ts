import { expect, test } from "vitest";

import { parseInlineMarkdown } from "./parse-inline-markdown";

test("splits out code spans, bold text, and links", () => {
  expect(
    parseInlineMarkdown(
      "**Breaking:** renames `saveAs`, see [the docs](https://www.qino.works).",
    ),
  ).toEqual([
    { type: "strong", text: "Breaking:" },
    { type: "text", text: " renames " },
    { type: "code", text: "saveAs" },
    { type: "text", text: ", see " },
    { type: "link", text: "the docs", href: "https://www.qino.works" },
    { type: "text", text: "." },
  ]);
});

test("keeps Markdown inside code spans as code", () => {
  expect(parseInlineMarkdown("Adds `**[x](y)**`")).toEqual([
    { type: "text", text: "Adds " },
    { type: "code", text: "**[x](y)**" },
  ]);
});

test("closes bold text outside its code spans", () => {
  expect(parseInlineMarkdown("**Use the `**` marker** now")).toEqual([
    { type: "strong", text: "Use the `**` marker" },
    { type: "text", text: " now" },
  ]);
});

test("keeps balanced parentheses in link URLs", () => {
  expect(
    parseInlineMarkdown("See [Foo](https://example.com/api/Foo_(bar))."),
  ).toEqual([
    { type: "text", text: "See " },
    { type: "link", text: "Foo", href: "https://example.com/api/Foo_(bar)" },
    { type: "text", text: "." },
  ]);
});

test("keeps the text of relative and malformed links", () => {
  expect(
    parseInlineMarkdown("See [the guide](/docs/guide) or [this](https://)."),
  ).toEqual([
    { type: "text", text: "See " },
    { type: "text", text: "the guide" },
    { type: "text", text: " or " },
    { type: "text", text: "this" },
    { type: "text", text: "." },
  ]);
});

test("keeps the Markdown inside bold text and link labels", () => {
  expect(
    parseInlineMarkdown("**`getEntries` pages** with [`view`](https://x.dev)"),
  ).toEqual([
    { type: "strong", text: "`getEntries` pages" },
    { type: "text", text: " with " },
    { type: "link", text: "`view`", href: "https://x.dev" },
  ]);
});

test("returns plain text as one segment", () => {
  expect(parseInlineMarkdown("Shares work between calls.")).toEqual([
    { type: "text", text: "Shares work between calls." },
  ]);
});
