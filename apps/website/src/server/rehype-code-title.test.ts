import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";

import { rehypeCodeTitle } from "./rehype-code-title";

function codeBlock(meta?: string): Element {
  return {
    type: "element",
    tagName: "pre",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "code",
        properties: {},
        data: meta ? ({ meta } as Element["data"]) : undefined,
        children: [{ type: "text", value: "const a = 1;\n" }],
      },
    ],
  };
}

function run(tree: Root) {
  rehypeCodeTitle()(tree);
  return tree;
}

describe("rehypeCodeTitle", () => {
  it("wraps a titled code block in a figure with its title and code", () => {
    const pre = codeBlock('title="qino/index.ts"');
    const tree = run({ type: "root", children: [pre] });

    expect(tree.children).toEqual([
      {
        type: "element",
        tagName: "figure",
        properties: { dataTitle: "qino/index.ts", dataCode: "const a = 1;" },
        children: [pre],
      },
    ]);
  });

  it("joins the text of highlighted code", () => {
    const pre = codeBlock('title="qino/index.ts"');
    const code = pre.children[0] as Element;
    code.children = [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["hljs-keyword"] },
        children: [{ type: "text", value: "const" }],
      },
      { type: "text", value: " a = " },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["hljs-number"] },
        children: [{ type: "text", value: "1" }],
      },
      { type: "text", value: ";\n" },
    ];
    const tree = run({ type: "root", children: [pre] });

    const figure = tree.children[0] as Element;
    expect(figure.properties.dataCode).toBe("const a = 1;");
  });

  it("leaves code blocks without a title untouched", () => {
    const pre = codeBlock();
    const other = codeBlock("showLineNumbers");
    const tree = run({ type: "root", children: [pre, other] });

    expect(tree.children).toEqual([pre, other]);
  });

  it("finds titled code blocks nested in other elements", () => {
    const tree = run({
      type: "root",
      children: [
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [codeBlock('title="next.config.ts"')],
        },
      ],
    });

    const div = tree.children[0] as Element;
    expect((div.children[0] as Element).tagName).toBe("figure");
  });
});
