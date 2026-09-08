// AST = “Abstract Syntax Tree”

export type MarkdownASTNode = {
  type: string;
  value?: unknown;
  children?: Array<unknown>;
};

export function isMarkdownASTNode(value: unknown): value is MarkdownASTNode {
  return (
    typeof value == "object" &&
    value != null &&
    "type" in value &&
    typeof value.type == "string"
  );
}
