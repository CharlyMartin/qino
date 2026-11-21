import { describe, expect, test } from "vitest";

import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { rendersNothing } from "./renders-nothing";

function firstBlock(body: string, mdx: boolean) {
  const [first] = parseMarkdownBody(body, { mdx }).children;
  if (!first) throw new Error(`No block in ${body}`);
  return first;
}

describe("rendersNothing", () => {
  test.each([
    ['import X from "x";\n', true],
    ["<!-- a -->\n", false],
    ["<!-- a --><!-- b -->\n", false],
    ["   <!-- indented -->\n", false],
    ["<!--\nmulti-line\n-->\n", false],
    ["{/* a */}\n", true],
    ["{/* a */} {/* b */}\n", true],
  ])("is true for %j (MDX: %s)", (body, mdx) => {
    expect(rendersNothing(firstBlock(body, mdx))).toBe(true);
  });

  test.each([
    ["<!-- a --> Intro <!-- b -->\n", false],
    ["<!-- a --> <b>x</b>\n", false],
    ["<div>\n", false],
    ["{x}\n", true],
    ["{/* a */} text\n", true],
    ["Text.\n", true],
  ])("is false for %j (MDX: %s), which renders", (body, mdx) => {
    expect(rendersNothing(firstBlock(body, mdx))).toBe(false);
  });
});
