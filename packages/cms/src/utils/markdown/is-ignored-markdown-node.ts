const ignoredNodeTypes = new Set([
  "code",
  "html",
  "inlineCode",
  "mdxFlowExpression",
  "mdxJsxFlowElement",
  "mdxJsxTextElement",
  "mdxTextExpression",
  "mdxjsEsm",
]);

export function isIgnoredMarkdownNode(type: string) {
  return ignoredNodeTypes.has(type);
}
