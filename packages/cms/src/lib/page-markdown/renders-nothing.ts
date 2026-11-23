import type { Nodes } from "mdast";

// One or more HTML comments, and nothing else.
const COMMENTS = /^\s*(?:<!--(?:(?!-->)[\s\S])*-->\s*)+$/;

/**
 * Whether a parsed block renders nothing: an MDX `import` or `export`, a link
 * definition such as `[guide]: /guide`, HTML comments, or MDX comments such as
 * `{/* note *\/}`, alone or on one line.
 */
export function rendersNothing(node: Nodes): boolean {
  switch (node.type) {
    case "mdxjsEsm":
    case "definition":
      return true;
    case "html":
      return COMMENTS.test(node.value);
    // A comment parses to a program without statements.
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return node.data?.estree?.body.length == 0;
    case "text":
      return !node.value.trim();
    case "paragraph":
      return node.children.every(rendersNothing);
    default:
      return false;
  }
}
