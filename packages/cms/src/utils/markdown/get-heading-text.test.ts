import type { Heading } from "mdast";
import { describe, expect, test } from "vitest";

import { getHeadingText } from "./get-heading-text";
import { parseMarkdownBody } from "./parse-markdown-body";

const rendered = { footnoteOrder: [], includeJsx: true };

function getFirstHeading(body: string, mdx = true) {
  return parseMarkdownBody(body, { mdx }).children.find(
    (node): node is Heading => node.type == "heading",
  );
}

describe("getHeadingText", () => {
  test("keeps text, inline code, and link text", () => {
    const heading = getFirstHeading("## A `b` [c](/d) **e**");

    expect(heading && getHeadingText(heading, rendered)).toBe("A b c e");
  });

  test("numbers footnote references", () => {
    const heading = getFirstHeading("## Hi[^x]\n\n[^x]: Note.");

    expect(
      heading &&
        getHeadingText(heading, {
          footnoteOrder: ["Y", "X"],
          includeJsx: true,
        }),
    ).toBe("Hi2");
  });

  test("drops MDX expressions", () => {
    const heading = getFirstHeading("## Version {1 + 1}");

    expect(heading && getHeadingText(heading, rendered)).toBe("Version ");
  });

  test("keeps MDX component text only with includeJsx", () => {
    const heading = getFirstHeading("## `watch`: <TypeText>() => T</TypeText>");

    expect(heading && getHeadingText(heading, rendered)).toBe("watch: () => T");
    expect(
      heading &&
        getHeadingText(heading, { footnoteOrder: [], includeJsx: false }),
    ).toBe("watch: ");
  });

  test("drops raw HTML and image alts", () => {
    const heading = getFirstHeading("## A <!-- c -->b ![alt](/i.png)", false);

    expect(heading && getHeadingText(heading, rendered)).toBe("A b ");
  });
});
