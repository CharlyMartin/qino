import { describe, expect, test } from "vitest";

import { parseMarkdownBody } from "./parse-markdown-body";

function headingChildren(body: string, mdx: boolean) {
  const [heading] = parseMarkdownBody(body, { mdx }).children;
  return heading?.type == "heading"
    ? heading.children.map((child) => child.type)
    : [];
}

describe("parseMarkdownBody", () => {
  test.each([true, false])(
    "reads {#id} into a headingId node, with mdx: %s",
    (mdx) => {
      expect(headingChildren("## Install {#install}", mdx)).toEqual([
        "text",
        "headingId",
      ]);
    },
  );

  test("leaves other braces to MDX, next to {#id} too", () => {
    const [paragraph] = parseMarkdownBody("a {1 + 1} b").children;

    expect(
      paragraph?.type == "paragraph" &&
        paragraph.children.map((child) => child.type),
    ).toEqual(["text", "mdxTextExpression", "text"]);
    expect(headingChildren("## A {#a}\n\n{1}", true)).toEqual([
      "text",
      "headingId",
    ]);
  });

  test("falls back to Markdown when the body isn't valid MDX", () => {
    expect(parseMarkdownBody("<!-- note -->\n\n## A {#a}").children).toEqual([
      expect.objectContaining({ type: "html" }),
      expect.objectContaining({ type: "heading" }),
    ]);
  });
});
