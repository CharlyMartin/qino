import { describe, expect, test } from "vitest";

import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { findJsxElements } from "./find-jsx-elements";

describe("findJsxElements", () => {
  test("finds the outermost components, blocks and inline", () => {
    const tree = parseMarkdownBody(
      "<A>\n  <B />\n</A>\n\nText with <C /> inside.\n\n```\n<D />\n```\n",
    );

    expect(findJsxElements(tree).map((element) => element.name)).toEqual([
      "A",
      "C",
    ]);
  });
});
