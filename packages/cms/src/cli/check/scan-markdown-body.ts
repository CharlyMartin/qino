import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";

import { extractHtmlAttributeUrls } from "./extract-html-attribute-urls";

const MEDIA_ATTRIBUTES = new Set(["src", "poster"]);
const IMAGE_ELEMENTS = new Set(["img", "Image"]);
type ScanMarkdownBodyOptions = { mdx: boolean };
type Link = { url: string; line: number; image: boolean };

/**
 * Collects image, link, and media attribute URLs; code is never visited.
 * `image` flags images: `![]()`, definitions used by `![][ref]`, and the
 * `src` of `<img>` or `<Image>`.
 */
export function scanMarkdownBody(
  content: string,
  { mdx }: ScanMarkdownBodyOptions,
) {
  // GFM matches how most sites render; without it a table is one paragraph.
  const tree = fromMarkdown(content, {
    extensions: mdx ? [gfm(), mdxjs()] : [gfm()],
    mdastExtensions: mdx
      ? [gfmFromMarkdown(), mdxFromMarkdown()]
      : [gfmFromMarkdown()],
  });

  const links: Array<Link> = [];
  const definitions: Array<Link & { identifier: string }> = [];
  const imageReferences = new Set<string>();

  function visit(node: Nodes) {
    const line = node.position?.start.line ?? 1;

    switch (node.type) {
      case "image":
        links.push({ url: node.url, line, image: true });
        break;
      case "link":
        links.push({ url: node.url, line, image: false });
        break;
      case "definition":
        definitions.push({
          url: node.url,
          line,
          image: false,
          identifier: node.identifier,
        });
        break;
      case "imageReference":
        imageReferences.add(node.identifier);
        break;
      case "html":
        for (const { url, lineOffset, image } of extractHtmlAttributeUrls(
          node.value,
        )) {
          links.push({ url, line: line + lineOffset, image });
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
            links.push({
              url,
              line: attribute.position?.start.line ?? line,
              image:
                IMAGE_ELEMENTS.has(node.name ?? "") && attribute.name == "src",
            });
          }
        }
        break;
    }

    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  visit(tree);

  for (const { identifier, ...link } of definitions) {
    links.push({ ...link, image: imageReferences.has(identifier) });
  }

  return links.sort((a, b) => a.line - b.line);
}
