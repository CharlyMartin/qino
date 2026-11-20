import type { Nodes } from "mdast";
import { describe, expect, test } from "vitest";

import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { readComponentProps } from "./read-component-props";

function attributesOf(jsx: string) {
  const [element] = parseMarkdownBody(jsx).children as Array<
    Extract<Nodes, { type: "mdxJsxFlowElement" }>
  >;
  return element?.attributes ?? [];
}

describe("readComponentProps", () => {
  test("reads strings, bare attributes and literal expressions", () => {
    expect(
      readComponentProps(
        attributesOf('<X s="a" bare n={1} o={{ k: [true] }} />'),
      ),
    ).toEqual({ s: "a", bare: true, n: 1, o: { k: [true] } });
  });

  test("leaves out spreads and attributes set by other expressions", () => {
    expect(
      readComponentProps(attributesOf("<X a={b} {...rest} d={1} />")),
    ).toEqual({ d: 1 });
  });
});
