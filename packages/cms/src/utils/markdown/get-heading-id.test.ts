import type { Heading } from "mdast";
import { describe, expect, test } from "vitest";

import { getHeadingId } from "./get-heading-id";
import { parseMarkdownBody } from "./parse-markdown-body";

function getFirstHeading(body: string, mdx = false) {
  return parseMarkdownBody(body, { mdx, headingIds: true }).children.find(
    (node): node is Heading => node.type == "heading",
  );
}

describe("getHeadingId", () => {
  test("reads {#id} in Markdown and MDX", () => {
    for (const mdx of [false, true]) {
      const heading = getFirstHeading("## Install {#setup}", mdx);

      expect(heading && getHeadingId(heading)).toBe("setup");
    }
  });

  test("decodes character references", () => {
    for (const mdx of [false, true]) {
      const heading = getFirstHeading("## Example {#a&amp;b&#45;c}", mdx);

      expect(heading && getHeadingId(heading)).toBe("a&b-c");
    }
  });

  test("keeps escaped and empty markers as text", () => {
    for (const body of ["## A \\{#a}", "## A {#}", "## A {#a b\\}"]) {
      const heading = getFirstHeading(body);

      expect(heading && getHeadingId(heading)).toBe(undefined);
    }
  });

  test("returns nothing without {#id}", () => {
    const heading = getFirstHeading("## A");

    expect(heading && getHeadingId(heading)).toBe(undefined);
  });
});
