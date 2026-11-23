import { expect, test } from "vitest";

import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { rangeOf } from "./range-of";

test("is where the node lies in its source", () => {
  const tree = parseMarkdownBody("Intro\n\nText\n");

  expect(tree.children.map(rangeOf)).toEqual([
    { start: 0, end: 5 },
    { start: 7, end: 11 },
  ]);
});
