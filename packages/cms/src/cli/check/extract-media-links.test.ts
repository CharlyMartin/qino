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
      { url: "/images/cover.png", line: 3 },
      { url: "/images/one.jpg", line: 5 },
      { url: "/images/inline.png", line: 8 },
      { url: "/videos/clip.mp4", line: 9 },
      { url: "/files/my doc.pdf", line: 10 },
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
      { url: "/real.png", line: 6 },
    ]);
  });

  test("reports body lines without frontmatter", () => {
    expect(extractMediaLinks("Hi\n\n![](/a.png)", ".markdown")).toEqual([
      { url: "/a.png", line: 3 },
    ]);
  });

  test("reports the file line of MDX parse errors", () => {
    expect(() =>
      extractMediaLinks("---\ntitle: Hi\n---\n\n<Image src=", ".mdx"),
    ).toThrow(/^line 5: /u);
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
      { url: "/about", line: 3 },
      { url: "/a.webp", line: 6 },
    ]);
  });

  test("deduplicates the same url on the same line", () => {
    expect(
      extractMediaLinks(`<img src="/a.png" /> ![](/a.png)`, ".md"),
    ).toEqual([{ url: "/a.png", line: 1 }]);
  });
});
