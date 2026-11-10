import type { Nodes } from "hast";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, test } from "vitest";

import { getMarkdownToc } from "./get-markdown-toc";

const rehypeProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug);

// The MDX nodes pass through to hast, as in `@mdx-js/mdx`.
const mdxRehypeProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMdx)
  .use(remarkRehype, {
    passThrough: [
      "mdxFlowExpression",
      "mdxJsxFlowElement",
      "mdxJsxTextElement",
      "mdxTextExpression",
      "mdxjsEsm",
    ],
  })
  .use(rehypeSlug);

function getHeadingIds(node: Nodes): string[] {
  const own =
    node.type == "element" && /^h[1-6]$/.test(node.tagName)
      ? [String(node.properties.id)]
      : [];
  const children = "children" in node ? node.children : [];

  return [...own, ...children.flatMap(getHeadingIds)];
}

async function getRehypeSlugIds(body: string, processor = rehypeProcessor) {
  const ids = getHeadingIds(await processor.run(processor.parse(body)));

  // remark-rehype adds a "Footnotes" heading that isn't in the body.
  return ids.filter((id) => id != "footnote-label");
}

describe("getMarkdownToc", () => {
  test("lists every heading in document order", () => {
    const body = [
      "# Title",
      "",
      "## Install",
      "",
      "### With pnpm",
      "",
      "#### Workspace",
      "",
      "## Usage",
    ].join("\n");

    expect(getMarkdownToc({ body })).toEqual([
      { heading: 1, id: "title", text: "Title" },
      { heading: 2, id: "install", text: "Install" },
      { heading: 3, id: "with-pnpm", text: "With pnpm" },
      { heading: 4, id: "workspace", text: "Workspace" },
      { heading: 2, id: "usage", text: "Usage" },
    ]);
  });

  test("stops at upTo", () => {
    const body = "## Install\n\n### With pnpm\n\n#### Workspace";

    expect(getMarkdownToc({ body, upTo: 3 }).map(({ id }) => id)).toEqual([
      "install",
      "with-pnpm",
    ]);
  });

  test("suffixes duplicates, counting headings left out by upTo", () => {
    const body = "### Example\n\n## Example\n\n## Example";

    expect(getMarkdownToc({ body, upTo: 2 }).map(({ id }) => id)).toEqual([
      "example-1",
      "example-2",
    ]);
  });

  test("keeps the text of inline code, emphasis, and links", () => {
    expect(
      getMarkdownToc({
        body: "## The `markdownToc` **flag** in [Qino](/docs)",
      }),
    ).toEqual([
      {
        heading: 2,
        id: "the-markdowntoc-flag-in-qino",
        text: "The markdownToc flag in Qino",
      },
    ]);
  });

  test("ignores headings in code blocks", () => {
    const body = "## Real\n\n```md\n## Fake\n```";

    expect(getMarkdownToc({ body }).map(({ text }) => text)).toEqual(["Real"]);
  });

  test("lists headings nested in blocks and MDX components", () => {
    const body = [
      "> ## Quoted",
      "",
      "<Callout>",
      "",
      "## In a component",
      "",
      "</Callout>",
    ].join("\n");

    expect(getMarkdownToc({ body, mdx: true }).map(({ id }) => id)).toEqual([
      "quoted",
      "in-a-component",
    ]);
  });

  test("keeps braces as text in Markdown, where they aren't expressions", () => {
    const body = "## Configure {name}";

    expect(getMarkdownToc({ body })).toEqual([
      { heading: 2, id: "configure-name", text: "Configure {name}" },
    ]);
    expect(getMarkdownToc({ body, mdx: true })[0]?.id).toBe("configure-");
  });

  test("falls back to Markdown when the body isn't valid MDX", () => {
    const body = "<!-- comment -->\n\n## After the comment";

    expect(getMarkdownToc({ body, mdx: true }).map(({ id }) => id)).toEqual([
      "after-the-comment",
    ]);
  });

  test("skips empty headings but still counts them", () => {
    expect(getMarkdownToc({ body: "##\n\n## A\n\n##" })).toEqual([
      { heading: 2, id: "a", text: "A" },
    ]);
  });

  test("returns an empty list without headings", () => {
    expect(getMarkdownToc({ body: "" })).toEqual([]);
    expect(getMarkdownToc({ body: "Just prose." })).toEqual([]);
  });

  test("matches the ids rehype-slug gives the rendered headings", async () => {
    const body = [
      "# Hello World",
      "",
      "## Hello   world",
      "",
      "## `code` and **bold** ![alt](/a.png)",
      "",
      "### Ünïcödé & émoji 👋",
      "",
      "## Hello World",
      "",
      "Setext heading",
      "--------------",
      "",
      "## C++ / C# (and more)",
      "",
      "> ### Quoted",
      "",
      "## Notes[^b] and more[^a]",
      "",
      "## Again[^a]",
      "",
      "## Hello <!-- comment -->world",
      "",
      "Text[^b].",
      "",
      "[^a]: First.",
      "[^b]: Second.",
    ].join("\n");

    expect(getMarkdownToc({ body }).map(({ id }) => id)).toEqual(
      await getRehypeSlugIds(body),
    );
  });

  test("matches rehype-slug for headings in footnotes", async () => {
    const body = [
      "[^unused]:",
      "    ## Example",
      "",
      "## Example[^b]",
      "",
      "[^a]:",
      "    ## Example",
      "",
      "[^b]: See[^a].",
      "",
      "    ## Example",
    ].join("\n");

    expect(getMarkdownToc({ body }).map(({ id }) => id)).toEqual(
      await getRehypeSlugIds(body),
    );
  });

  test("matches rehype-slug through the MDX pipeline", async () => {
    const body = [
      "## Version {1 + 1}",
      "",
      "## Hello {/* hidden */}world",
      "",
      "## With <Badge>new</Badge> badge",
      "",
      "<Callout>",
      "",
      "## Version {2}",
      "",
      "</Callout>",
    ].join("\n");

    expect(getMarkdownToc({ body, mdx: true }).map(({ id }) => id)).toEqual(
      await getRehypeSlugIds(body, mdxRehypeProcessor),
    );
  });
});
