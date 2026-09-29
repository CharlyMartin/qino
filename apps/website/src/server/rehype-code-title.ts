import type { Element, ElementContent, Root } from "hast";

const TITLE = /\btitle="([^"]+)"/;

// Wraps ```lang title="path" blocks in a figure carrying the title and raw code,
// which `CodeFigure` renders as a title bar with a copy button.
export function rehypeCodeTitle() {
  return function transform(tree: Root) {
    wrap(tree);
  };

  function wrap(parent: Root | Element) {
    parent.children = parent.children.map((child) => {
      if (child.type != "element") return child;

      const code = child.tagName == "pre" ? child.children[0] : undefined;
      const meta =
        code?.type == "element"
          ? (code.data as { meta?: string } | undefined)?.meta
          : undefined;
      const title = meta?.match(TITLE)?.[1];
      if (!code || !title) {
        wrap(child);
        return child;
      }

      return {
        type: "element",
        tagName: "figure",
        properties: { dataTitle: title, dataCode: toText(code).trimEnd() },
        children: [child],
      } satisfies ElementContent;
    }) as typeof parent.children;
  }

  function toText(node: ElementContent): string {
    if (node.type == "text") return node.value;
    if (node.type != "element") return "";
    return node.children.map(toText).join("");
  }
}
