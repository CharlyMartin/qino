const blockNodeTypes = new Set([
  "blockquote",
  "footnoteDefinition",
  "list",
  "listItem",
  "root",
  "table",
  "tableRow",
]);

export function isMarkdownBlockNode(type: string) {
  return blockNodeTypes.has(type);
}
