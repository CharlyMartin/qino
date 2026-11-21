import { describe, expect, test } from "vitest";

import { buildIndexAgentMarkdown } from "./build-index-agent-markdown";

const link = {
  title: "Hello",
  url: "https://example.com/blog/hello.md",
  description: "",
};

describe("buildIndexAgentMarkdown", () => {
  test("lists links under the title", () => {
    expect(buildIndexAgentMarkdown({ title: "Blog", links: [link] })).toBe(
      "# Blog\n\n- [Hello](https://example.com/blog/hello.md)\n",
    );
  });

  test("lists sections under the title", () => {
    expect(
      buildIndexAgentMarkdown({
        title: "Docs",
        sections: [{ title: "Guide", links: [link] }],
      }),
    ).toBe(
      "# Docs\n\n## Guide\n\n- [Hello](https://example.com/blog/hello.md)\n",
    );
  });

  test("is the title alone with nothing to list", () => {
    expect(buildIndexAgentMarkdown({ title: "Blog" })).toBe("# Blog\n");
  });
});
