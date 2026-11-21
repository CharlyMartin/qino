import { describe, expect, test } from "vitest";

import type { MdxJsxElement } from "../../types/agent-markdown";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { readLiteralValue } from "./read-literal-value";

// The expression of `<X v={source} />`, as remark-mdx parses it.
function parseExpression(source: string) {
  const [element] = parseMarkdownBody(`<X v={${source}} />`)
    .children as Array<MdxJsxElement>;
  const attribute = element?.attributes[0];
  if (
    attribute?.type != "mdxJsxAttribute" ||
    typeof attribute.value != "object"
  ) {
    throw new Error(`No expression in ${source}`);
  }
  const statement = attribute.value?.data?.estree?.body[0];
  if (statement?.type != "ExpressionStatement") {
    throw new Error(`No expression in ${source}`);
  }
  return statement.expression;
}

describe("readLiteralValue", () => {
  test.each([
    ['"a"', "a"],
    ["3.5", 3.5],
    ["-2", -2],
    ["true", true],
    ["null", null],
    ["`plain`", "plain"],
    ['[1, "a", [false]]', [1, "a", [false]]],
    ['{ a: 1, "b-c": { d: [null] } }', { a: 1, "b-c": { d: [null] } }],
  ])("reads %s", (source, value) => {
    expect(readLiteralValue(parseExpression(source))).toEqual(value);
  });

  test.each([
    "id",
    "1 + 1",
    "-x",
    "!true",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a template literal's source
    "`a${b}`",
    "/re/",
    "10n",
    "[1, , 2]",
    "[...list]",
    "[1, id]",
    "{ [key]: 1 }",
    "{ a }",
    "{ a() {} }",
    "{ get a() { return 1 } }",
    "{ ...rest }",
    "{ 1: 'a' }",
    "f()",
  ])("leaves %s, which isn't a literal, undefined", (source) => {
    expect(readLiteralValue(parseExpression(source))).toBeUndefined();
  });

  test("keeps __proto__ as an own key", () => {
    const value = readLiteralValue(parseExpression("{ __proto__: { a: 1 } }"));

    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(Object.hasOwn(value as object, "__proto__")).toBe(true);
  });
});
