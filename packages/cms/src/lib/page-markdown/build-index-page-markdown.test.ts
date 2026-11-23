import { describe, expect, test } from "vitest";

import { buildIndexPageMarkdown } from "./build-index-page-markdown";

const link = {
  title: "Hello",
  url: "https://example.com/blog/hello.md",
  description: "",
};

describe("buildIndexPageMarkdown", () => {
  test("lists links under the title", () => {
    expect(buildIndexPageMarkdown({ title: "Blog", links: [link] })).toBe(
      "# Blog\n\n- [Hello](https://example.com/blog/hello.md)\n",
    );
  });

  test("lists sections under the title", () => {
    expect(
      buildIndexPageMarkdown({
        title: "Docs",
        sections: [{ title: "Guide", links: [link] }],
      }),
    ).toBe(
      "# Docs\n\n## Guide\n\n- [Hello](https://example.com/blog/hello.md)\n",
    );
  });

  test("is the title alone with nothing to list", () => {
    expect(buildIndexPageMarkdown({ title: "Blog" })).toBe("# Blog\n");
  });
});
