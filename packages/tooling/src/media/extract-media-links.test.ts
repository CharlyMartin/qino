import { describe, expect, test } from "vitest";

import { extractMediaLinks } from "./extract-media-links";

describe("extractMediaLinks", () => {
  test("extracts local urls from frontmatter and body with line numbers", () => {
    const raw = [
      "---",
      "title: Hello",
      "cover: /images/cover.png",
      "gallery:",
      "  - src: /images/one.jpg",
      "---",
      "",
      "![Alt](/images/inline.png?w=200)",
      `<video src="/videos/clip.mp4"></video>`,
      "[Download](/files/my%20doc.pdf)",
    ].join("\n");

    expect(extractMediaLinks(raw, ".md")).toEqual([
      { url: "/images/cover.png", line: 3, image: false },
      { url: "/images/one.jpg", line: 5, image: false },
      { url: "/images/inline.png", line: 8, image: true },
      { url: "/videos/clip.mp4", line: 9, image: false },
      { url: "/files/my doc.pdf", line: 10, image: false },
    ]);
  });

  test("ignores YAML comments in frontmatter", () => {
    const raw = [
      "---",
      "# Example: ![](/placeholder.png)",
      "title: Hello",
      "---",
      "",
      "![](/real.png)",
    ].join("\n");

    expect(extractMediaLinks(raw, ".md")).toEqual([
      { url: "/real.png", line: 6, image: true },
    ]);
  });

  test("reports body lines without frontmatter", () => {
    expect(extractMediaLinks("Hi\n\n![](/a.png)", ".markdown")).toEqual([
      { url: "/a.png", line: 3, image: true },
    ]);
  });

  test("reports the file line of MDX parse errors", () => {
    expect(() =>
      extractMediaLinks("---\ntitle: Hi\n---\n\n<Image src=", ".mdx"),
    ).toThrow(/^line 5: /u);
  });

  test("reports file positions inside MDX error messages", () => {
    expect(() =>
      extractMediaLinks("---\ntitle: Hi\n---\n\nText <message>\nmore", ".mdx"),
    ).toThrow(/^line 5: .*\(5:6-5:15\)/u);
  });

  test("ignores external and relative urls", () => {
    const raw = [
      "---",
      "image: https://example.com/a.png",
      "---",
      "![](https://example.com/b.png)",
      "![](//cdn.example.com/c.png)",
      "![](./local.png)",
      "[Anchor](#top)",
    ].join("\n");

    expect(extractMediaLinks(raw, ".mdx")).toEqual([]);
  });

  test("extracts deep strings from JSON files", () => {
    const raw = JSON.stringify(
      { title: "Hi", link: "/about", media: [{ src: "/a.webp" }] },
      null,
      2,
    );

    expect(extractMediaLinks(raw, ".json")).toEqual([
      { url: "/about", line: 3, image: false },
      { url: "/a.webp", line: 6, image: false },
    ]);
  });

  test("deduplicates the same url on the same line", () => {
    expect(
      extractMediaLinks(`<img src="/a.png" /> ![](/a.png)`, ".md"),
    ).toEqual([{ url: "/a.png", line: 1, image: true }]);
  });
});
