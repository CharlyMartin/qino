import { describe, expect, test } from "vitest";

import { buildAgentMarkdown } from "./build-agent-markdown";

const origin = "https://example.com";

describe("buildAgentMarkdown", () => {
  test("opens with the title and description, then the body", () => {
    const entry = {
      title: "Hello",
      description: "A first post.",
      markdown: "\nSee [the guide](/docs/guide).\n",
    };

    expect(
      buildAgentMarkdown({ entry, slug: "hello", extension: ".md", origin }),
    ).toBe(
      "# Hello\n\n> A first post.\n\nSee [the guide](https://example.com/docs/guide).\n",
    );
  });

  test("keeps a body's own H1 opening, without the title or description", () => {
    const entry = {
      title: "Hello",
      description: "A first post.",
      markdown: "# Hello, world\n\nBody.\n",
    };

    expect(
      buildAgentMarkdown({ entry, slug: "hello", extension: ".md", origin }),
    ).toBe("# Hello, world\n\nBody.\n");
  });

  test("reads no body from a JSON entry", () => {
    const entry = { title: "Jane", markdown: "Data, not a body." };

    expect(
      buildAgentMarkdown({ entry, slug: "jane", extension: ".json", origin }),
    ).toBe("# Jane\n");
  });

  test("falls back to the slug when the title isn't a string", () => {
    const entry = { title: 42, markdown: "Body.\n" };

    expect(
      buildAgentMarkdown({ entry, slug: "untitled", extension: ".md", origin }),
    ).toBe("# untitled\n\nBody.\n");
  });
});
