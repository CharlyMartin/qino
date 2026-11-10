import type { Heading } from "mdast";
import { describe, expect, test } from "vitest";

import { getHeadingText } from "./get-heading-text";
import { parseMarkdownBody } from "./parse-markdown-body";

function getFirstHeading(body: string) {
  return parseMarkdownBody(body).children.find(
    (node): node is Heading => node.type == "heading",
  );
}

describe("getHeadingText", () => {
  test("keeps text, inline code, and link text", () => {
    const heading = getFirstHeading("## A `b` [c](/d) **e**");

    expect(heading && getHeadingText(heading, [])).toBe("A b c e");
  });

  test("numbers footnote references", () => {
    const heading = getFirstHeading("## Hi[^x]\n\n[^x]: Note.");

    expect(heading && getHeadingText(heading, ["Y", "X"])).toBe("Hi2");
  });

  test("drops MDX expressions but keeps component text", () => {
    const heading = getFirstHeading("## Version {1 + 1} <Badge>new</Badge>");

    expect(heading && getHeadingText(heading, [])).toBe("Version  new");
  });

  test("drops raw HTML and image alts", () => {
    const heading = getFirstHeading(
      "<!-- force Markdown -->\n\n## A <!-- c -->b ![alt](/i.png)",
    );

    expect(heading && getHeadingText(heading, [])).toBe("A b ");
  });
});
