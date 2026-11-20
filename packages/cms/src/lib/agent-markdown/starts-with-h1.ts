import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";

type StartsWithH1Options = {
  mdx: boolean;
};

/**
 * Whether a Markdown body opens with an H1, after anything that renders
 * nothing: MDX `import`s and `export`s, HTML comments and MDX comments.
 */
export function startsWithH1(body: string, { mdx }: StartsWithH1Options) {
  const first = parseMarkdownBody(body, {
    mdx,
    headingIds: true,
  }).children.find((node) => {
    if (node.type == "mdxjsEsm") return false;
    if (node.type == "html") return !/^<!--[\s\S]*-->\s*$/.test(node.value);
    // `{/* comment */}` parses to a program without statements.
    if (node.type == "mdxFlowExpression") {
      return node.data?.estree?.body.length != 0;
    }
    return true;
  });
  return first?.type == "heading" && first.depth == 1;
}
