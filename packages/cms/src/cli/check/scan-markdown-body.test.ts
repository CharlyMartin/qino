import { describe, expect, test } from "vitest";

import { scanMarkdownBody } from "./scan-markdown-body";

function md(content: string) {
  return scanMarkdownBody(content, { mdx: false }).map(({ url }) => url);
}

function mdx(content: string) {
  return scanMarkdownBody(content, { mdx: true }).map(({ url }) => url);
}

describe("scanMarkdownBody", () => {
  test("finds images, links, and reference definitions", () => {
    expect(
      md(
        [
          "![Alt](/a.png)",
          "[PDF](/b.pdf)",
          "![ref][logo]",
          "",
          '[logo]: /c.svg "Logo"',
        ].join("\n"),
      ),
    ).toEqual(["/a.png", "/b.pdf", "/c.svg"]);
  });

  test("keeps complete destinations", () => {
    expect(
      md(
        [
          "![](/images/photo(1).png)",
          "![](</images/my image.png>)",
          "[![](/thumb.png)](/full.png)",
        ].join("\n\n"),
      ),
    ).toEqual([
      "/images/photo(1).png",
      "/images/my image.png",
      "/full.png",
      "/thumb.png",
    ]);
  });

  test("parses GFM tables cell by cell", () => {
    const content = [
      "| Message | Preview |",
      "| --- | --- |",
      "| `Use \\`a\\`.` | ![](/a.png) |",
      "| `Error: <message>` | ![](/b.png) |",
    ].join("\n");

    expect(md(content)).toEqual(["/a.png", "/b.png"]);
    expect(mdx(content)).toEqual(["/a.png", "/b.png"]);
  });

  test("ignores every kind of code", () => {
    const content = [
      "```md",
      "![](/fenced.png)",
      "```",
      "",
      "    ![](/indented.png)",
      "",
      "> ```",
      "> ![](/quoted-fence.png)",
      "> ```",
      "",
      'Use `![](/inline.png)` or ``<img src="/double.png">``, and `a',
      "![](/multiline.png)` too.",
      "",
      "![](/real.png)",
    ].join("\n");

    expect(md(content)).toEqual(["/real.png"]);
  });

  test("reads src and poster from raw HTML, decoding entities", () => {
    const content = [
      '<video poster="/a&amp;b.jpg">',
      "  <source src='/c.mp4' />",
      "</video>",
      "",
      "Inline <img src=/d.png> here.",
    ].join("\n");

    expect(scanMarkdownBody(content, { mdx: false })).toEqual([
      { url: "/a&b.jpg", line: 1 },
      { url: "/c.mp4", line: 2 },
      { url: "/d.png", line: 5 },
    ]);
  });

  test("ignores HTML comments", () => {
    expect(
      md(
        '<!-- <img src="/placeholder.png" /> -->\n\nText <!-- <img src="/b.png"> -->',
      ),
    ).toEqual([]);
  });

  test("reads escaped MDX string literals", () => {
    expect(
      mdx(
        [
          "<Image src={'/images/it\\'s.png'} />",
          '<Image src={"/a\\"b.png"} />',
          "<Image src={`/c\\`d.png`} />",
        ].join("\n\n"),
      ),
    ).toEqual(["/images/it's.png", '/a"b.png', "/c`d.png"]);
  });

  test("reads src and poster from MDX JSX string values", () => {
    expect(
      mdx(
        [
          '<Image src="/a&amp;b.png" />',
          '<Image src={"/b.png"} />',
          "<Video poster={'/c.jpg'} src={`/d.mp4`} />",
          "<Image src={cover} />",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: MDX source
          "<Image src={`/${slug}.png`} />",
          '<p>Inline <img src="/e.png" /></p>',
        ].join("\n\n"),
      ),
    ).toEqual(["/a&b.png", "/b.png", "/c.jpg", "/d.mp4", "/e.png"]);
  });

  test("reports line numbers", () => {
    expect(scanMarkdownBody("# Title\n\n![](/a.png)", { mdx: false })).toEqual([
      { url: "/a.png", line: 3 },
    ]);
  });

  test("throws on invalid MDX", () => {
    expect(() => mdx("<Image src=")).toThrow();
  });
});
