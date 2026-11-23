import { describe, expect, test } from "vitest";

import type { MdxJsxElement } from "../../types/page-markdown";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { readComponentProps } from "./read-component-props";

function attributesOf(jsx: string) {
  const [element] = parseMarkdownBody(jsx).children as Array<MdxJsxElement>;
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
