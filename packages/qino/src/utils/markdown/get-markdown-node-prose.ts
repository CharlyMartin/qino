import { isIgnoredMarkdownNode } from "./is-ignored-markdown-node";
import { isMarkdownASTNode } from "./is-markdown-ast-node";
import { isMarkdownBlockNode } from "./is-markdown-block-node";

export function getMarkdownNodeProse(value: unknown): string {
  if (!isMarkdownASTNode(value)) return "";

  if (value.type == "text" && typeof value.value == "string") {
    return value.value;
  }

  if (value.type == "break") return "\n";
  if (isIgnoredMarkdownNode(value.type) || !value.children) return "";

  return value.children
    .map(getMarkdownNodeProse)
    .filter(Boolean)
    .join(isMarkdownBlockNode(value.type) ? "\n" : "");
}
