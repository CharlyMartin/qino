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

  test("leaves MDX components out of text, but not out of the id", () => {
    const body = "## \\</> `watch`: <TypeText>(name) => T</TypeText> <Since />";

    expect(getMarkdownToc({ body, mdx: true })).toEqual([
      { heading: 2, id: "-watch-name--t-", text: "</> watch:" },
    ]);
  });

  test("uses {#id} and strips it from the text", () => {
    const body = "## Install {#Installation}\n\n## Install\n\n### `x` {#X}";

    for (const mdx of [false, true]) {
      expect(getMarkdownToc({ body, mdx })).toEqual([
        { heading: 2, id: "Installation", text: "Install" },
        // `rehype-slug` doesn't count custom ids.
        { heading: 2, id: "install", text: "Install" },
        { heading: 3, id: "X", text: "x" },
      ]);
    }
  });

  test("finds {#id} on any line of a setext heading", () => {
    const body = "First\nsecond {#custom}\n---";

    expect(getMarkdownToc({ body })).toEqual([
      { heading: 2, id: "custom", text: "First second" },
    ]);
  });

  test("finds {#id} on its own line in a setext heading", () => {
    for (const mdx of [false, true]) {
      expect(getMarkdownToc({ body: "Title\n{#custom}\n---", mdx })).toEqual([
        { heading: 2, id: "custom", text: "Title" },
      ]);
    }
  });

  test("leaves {#id}-like lines in code blocks alone", () => {
    const body = "~~~md\n~~~ {#example}\n## Not a heading\n~~~\n\n## Real";

    expect(getMarkdownToc({ body }).map(({ id }) => id)).toEqual(["real"]);
  });

  test("finds {#id} in blockquoted setext headings and MDX components", () => {
    const quoted = "> Title\n> {#quoted}\n> ---";
    const wrapped = "<Wrapper>\n## Title {#wrapped}\n</Wrapper>";

    expect(getMarkdownToc({ body: quoted }).map(({ id }) => id)).toEqual([
      "quoted",
    ]);
    expect(
      getMarkdownToc({ body: wrapped, mdx: true }).map(({ id }) => id),
    ).toEqual(["wrapped"]);
  });

  test("keeps escaped {#id} as text", () => {
    expect(getMarkdownToc({ body: "## Literal \\{#example}" })).toEqual([
      {
        heading: 2,
        id: "literal-example",
        text: "Literal {#example}",
      },
    ]);
  });

  test("keeps the rest of an MDX body when it has {#id}", () => {
    const body = "## A {#a}\n\n## B <Badge>new</Badge>";

    expect(getMarkdownToc({ body, mdx: true }).map(({ text }) => text)).toEqual(
      ["A", "B"],
    );
  });

  test("slugs text with slug, deduplicating against every id", () => {
    const body = [
      "## \\</> `useForm`: <TypeText>Props</TypeText>",
      "",
      "## Use Form {#useForm-1}",
      "",
      "## useForm",
      "",
      "## <Badge>only a component</Badge>",
    ].join("\n");
    const slug = (text: string) => text.replace(/[^a-zA-Z0-9]/g, "");

    expect(getMarkdownToc({ body, mdx: true, slug })).toEqual([
      { heading: 2, id: "useForm", text: "</> useForm:" },
      { heading: 2, id: "useForm-1", text: "Use Form" },
      { heading: 2, id: "useForm-2", text: "useForm" },
    ]);
  });

  test("only counts listed headings as used ids with slug", () => {
    const body = "##### Examples\n\n### Examples\n\n### Examples";
    const slug = (text: string) => text;

    expect(getMarkdownToc({ body, upTo: 4, slug })).toEqual([
      { heading: 3, id: "Examples", text: "Examples" },
      { heading: 3, id: "Examples-1", text: "Examples" },
    ]);
    // `rehype-slug` names every heading, so the h5 still counts there.
    expect(getMarkdownToc({ body, upTo: 4 }).map(({ id }) => id)).toEqual([
      "examples-1",
      "examples-2",
    ]);
  });

  test("doesn't count an unlisted {#id} toward duplicates with slug", () => {
    const body = "##### Hidden {#Example}\n\n## Example";

    expect(getMarkdownToc({ body, upTo: 2, slug: (text) => text })).toEqual([
      { heading: 2, id: "Example", text: "Example" },
    ]);
  });

  test("doesn't reserve an id for unlisted headings with slug", () => {
    const body = "##### !!!\n\n## !!!";
    const slug = (text: string) => text.replace(/[^a-zA-Z0-9]/g, "");

    expect(getMarkdownToc({ body, upTo: 4, slug })).toEqual([
      { heading: 2, id: "", text: "!!!" },
    ]);
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
