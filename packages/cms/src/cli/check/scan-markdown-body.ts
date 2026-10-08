import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";

import { extractHtmlAttributeUrls } from "./extract-html-attribute-urls";

const MEDIA_ATTRIBUTES = new Set(["src", "poster"]);
type ScanMarkdownBodyOptions = { mdx: boolean };

/** Collects image, link, and media attribute URLs; code is never visited. */
export function scanMarkdownBody(
  content: string,
  { mdx }: ScanMarkdownBodyOptions,
) {
  const tree = mdx
    ? fromMarkdown(content, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })
    : fromMarkdown(content);

  const links: Array<{ url: string; line: number }> = [];

  function visit(node: Nodes) {
    const line = node.position?.start.line ?? 1;

    switch (node.type) {
      case "image":
      case "link":
      case "definition":
        links.push({ url: node.url, line });
        break;
      case "html":
        for (const { url, lineOffset } of extractHtmlAttributeUrls(
          node.value,
        )) {
          links.push({ url, line: line + lineOffset });
        }
        break;
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement":
        for (const attribute of node.attributes) {
          if (
            attribute.type != "mdxJsxAttribute" ||
            !MEDIA_ATTRIBUTES.has(attribute.name)
          ) {
            continue;
          }

          const { value } = attribute;
          // Expressions are pre-parsed by acorn: read static strings only.
          const statement =
            typeof value == "object" ? value?.data?.estree?.body[0] : undefined;
          const expression =
            statement?.type == "ExpressionStatement"
              ? statement.expression
              : undefined;
          const url =
            typeof value == "string"
              ? value
              : expression?.type == "Literal" &&
                  typeof expression.value == "string"
                ? expression.value
                : expression?.type == "TemplateLiteral" &&
                    expression.expressions.length == 0
                  ? expression.quasis[0]?.value.cooked
                  : undefined;

          if (url != null) {
            links.push({ url, line: attribute.position?.start.line ?? line });
          }
        }
        break;
    }

    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  visit(tree);

  return links;
}
