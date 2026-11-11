import { describe, expect, test } from "vitest";

import { extractMediaCandidates } from "./extract-media-candidates";

describe("extractMediaCandidates", () => {
  test("lists frontmatter strings and body urls as written", () => {
    const raw = [
      "---",
      "cover: cover.webp",
      "---",
      "",
      "![Alt](./inline.png?w=200)",
      "[Download](/files/my%20doc.pdf)",
      "![](https://example.com/b.png)",
    ].join("\n");

    expect(extractMediaCandidates(raw, ".md")).toEqual([
      { url: "cover.webp", line: 2, image: false },
      { url: "./inline.png?w=200", line: 5, image: true },
      { url: "/files/my%20doc.pdf", line: 6, image: false },
      { url: "https://example.com/b.png", line: 7, image: true },
    ]);
  });

  test("lists deep strings from JSON files, with no body", () => {
    const raw = JSON.stringify({ media: [{ src: "a.webp" }] }, null, 2);

    expect(extractMediaCandidates(raw, ".json")).toEqual([
      { url: "a.webp", line: 4, image: false },
    ]);
  });

  test("reports the file line of MDX parse errors", () => {
    expect(() =>
      extractMediaCandidates("---\ntitle: Hi\n---\n\n<Image src=", ".mdx"),
    ).toThrow(/^line 5: /u);
  });
});
