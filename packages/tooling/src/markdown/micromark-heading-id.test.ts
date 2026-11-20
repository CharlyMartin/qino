import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { describe, expect, test } from "vitest";

import { micromarkHeadingId } from "./micromark-heading-id";

function parseMdx(content: string) {
  return fromMarkdown(content, {
    extensions: [mdxjs(), micromarkHeadingId()],
    mdastExtensions: [mdxFromMarkdown()],
  });
}

describe("micromarkHeadingId", () => {
  test("lets MDX read {#id}, which it would take for an invalid expression", () => {
    expect(() =>
      fromMarkdown("## Install {#install}", {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      }),
    ).toThrow();
    expect(parseMdx("## Install {#install}").children[0]?.type).toBe("heading");
  });

  test("leaves other braces to MDX", () => {
    const [paragraph] = parseMdx("a {1 + 1} b").children;

    expect(
      paragraph?.type == "paragraph" &&
        paragraph.children.map((child) => child.type),
    ).toEqual(["text", "mdxTextExpression", "text"]);
  });

  test.each(["{#}", "{#a\nb}", "{#a{b}"])(
    "doesn't read %j as an id",
    (content) => {
      expect(() => parseMdx(content)).toThrow();
    },
  );
});
