import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";

type StartsWithH1Options = {
  mdx: boolean;
};

/** Whether a Markdown body opens with an H1, after any MDX `import`s and `export`s. */
export function startsWithH1(body: string, { mdx }: StartsWithH1Options) {
  const first = parseMarkdownBody(body, { mdx }).children.find(
    (node) => node.type != "mdxjsEsm",
  );
  return first?.type == "heading" && first.depth == 1;
}
