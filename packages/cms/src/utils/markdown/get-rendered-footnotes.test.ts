import { describe, expect, test } from "vitest";

import { getRenderedFootnotes } from "./get-rendered-footnotes";
import { parseMarkdownBody } from "./parse-markdown-body";

function getRenderedIds(body: string) {
  return getRenderedFootnotes(parseMarkdownBody(body)).map(({ id }) => id);
}

describe("getRenderedFootnotes", () => {
  test("orders by first reference and drops unused footnotes", () => {
    const body = [
      "Text[^b] and[^A] again[^b].",
      "",
      "[^a]: First.",
      "[^b]: Second.",
      "[^unused]: Never shown.",
    ].join("\n");

    expect(getRenderedIds(body)).toEqual(["B", "A"]);
  });

  test("appends footnotes only referenced from other footnotes", () => {
    const body = [
      "Text[^a].",
      "",
      "[^a]: First[^c].",
      "[^c]: Nested[^d].",
      "[^d]: Deeper.",
    ].join("\n");

    expect(getRenderedIds(body)).toEqual(["A", "C", "D"]);
  });

  test("keeps the first definition of an id", () => {
    const tree = parseMarkdownBody("Text[^a].\n\n[^a]: One.\n\n[^a]: Two.");
    const [footnote] = getRenderedFootnotes(tree);

    expect(footnote?.definition.position?.start.line).toBe(3);
  });
});
