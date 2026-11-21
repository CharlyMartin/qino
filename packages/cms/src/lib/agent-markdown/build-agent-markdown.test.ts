import { describe, expect, test } from "vitest";

import { buildAgentMarkdown } from "./build-agent-markdown";

const origin = "https://example.com";

describe("buildAgentMarkdown", () => {
  test("opens with the title and description, then the body", async () => {
    const entry = {
      title: "Hello",
      description: "A first post.",
      markdown: "\nSee [the guide](/docs/guide).\n",
    };

    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "hello",
        extension: ".md",
        origin,
      }),
    ).toBe(
      "# Hello\n\n> A first post.\n\nSee [the guide](https://example.com/docs/guide).\n",
    );
  });

  test("keeps a body's own H1 opening, without the title or description", async () => {
    const entry = {
      title: "Hello",
      description: "A first post.",
      markdown: "# Hello, world\n\nBody.\n",
    };

    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "hello",
        extension: ".md",
        origin,
      }),
    ).toBe("# Hello, world\n\nBody.\n");
  });

  test("reads the title from titleField", async () => {
    const entry = { title: "Not this", label: "Guide", markdown: "Body.\n" };

    expect(
      await buildAgentMarkdown({
        entry,
        titleField: "label",
        fallbackTitle: "guide",
        extension: ".md",
        origin,
      }),
    ).toBe("# Guide\n\nBody.\n");
  });

  test("replaces components only in MDX, before making links absolute", async () => {
    const entry = { title: "Hello", markdown: "<Next />\n" };
    const components = { Next: () => "[Next](/next)" };

    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "hello",
        extension: ".mdx",
        origin,
        replacement: { components, entry },
      }),
    ).toBe("# Hello\n\n[Next](https://example.com/next)\n");
    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "hello",
        extension: ".md",
        origin,
        replacement: { components, entry },
      }),
    ).toBe("# Hello\n\n<Next />\n");
  });

  test("reads no body from a JSON entry", async () => {
    const entry = { title: "Jane", markdown: "Data, not a body." };

    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "jane",
        extension: ".json",
        origin,
      }),
    ).toBe("# Jane\n");
  });

  test.each([42, "", "  \n "])(
    "falls back to the slug for the title %j",
    async (title) => {
      const entry = { title, markdown: "Body.\n" };

      expect(
        await buildAgentMarkdown({
          entry,
          fallbackTitle: "untitled",
          extension: ".md",
          origin,
        }),
      ).toBe("# untitled\n\nBody.\n");
    },
  );

  test("quotes a description without the newline YAML block scalars end it with", async () => {
    const entry = { title: "Hello", description: "Some text.\n" };

    expect(
      await buildAgentMarkdown({
        entry,
        fallbackTitle: "hello",
        extension: ".md",
        origin,
      }),
    ).toBe("# Hello\n\n> Some text.\n");
  });

  test.each(["", "\n\n", "   "])(
    "leaves out the blank description %j",
    async (description) => {
      const entry = { title: "Hello", description };

      expect(
        await buildAgentMarkdown({
          entry,
          fallbackTitle: "hello",
          extension: ".md",
          origin,
        }),
      ).toBe("# Hello\n");
    },
  );
});
