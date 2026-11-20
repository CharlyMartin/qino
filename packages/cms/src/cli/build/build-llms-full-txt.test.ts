import { describe, expect, test } from "vitest";

import { buildLlmsFullTxt } from "./build-llms-full-txt";

const documents = ["# Guide\n\n> Start here.\n", "# CLI\n\nRun it.\n"];

describe("buildLlmsFullTxt", () => {
  test("opens with the template's H1 and summary, then each document, a blank line apart", () => {
    const template =
      "# Example\n\n> A site.\n> For everyone.\n\n## When to use\n\nAlways.\n\n## Optional\n\n- [GitHub](https://github.com/example)\n";

    expect(buildLlmsFullTxt({ template, documents })).toBe(
      "# Example\n\n> A site.\n> For everyone.\n\n# Guide\n\n> Start here.\n\n# CLI\n\nRun it.\n",
    );
  });

  test("drops frontmatter and leading blank lines, with LF line endings", () => {
    const template = "---\nnote: x\n---\r\n\r\n# Example\r\n\r\n> A site.\r\n";

    expect(buildLlmsFullTxt({ template, documents: [] })).toBe(
      "# Example\n\n> A site.\n",
    );
  });

  test.each([
    [
      "an id",
      "# Example {#top}\n\n> A site.\n",
      "# Example {#top}\n\n> A site.",
    ],
    ["a setext H1", "Example\n===\n\n> A site.\n", "Example\n===\n\n> A site."],
    [
      "comments before it",
      "<!-- generated -->\n\n# Example\n\n> A site.\n",
      "# Example\n\n> A site.",
    ],
    [
      "a comment before the summary",
      "# Example\n\n<!-- note -->\n\n> A site.\n",
      "# Example\n\n<!-- note -->\n\n> A site.",
    ],
    ["no summary", "# Example\n\nA site.\n", "# Example"],
    ["text before it", "A site.\n\n# Example\n", "# Example"],
  ])("keeps the H1 as written, with %s", (_, template, head) => {
    expect(buildLlmsFullTxt({ template, documents })).toBe(
      `${head}\n\n# Guide\n\n> Start here.\n\n# CLI\n\nRun it.\n`,
    );
  });

  test.each([
    ["empty", ""],
    ["without an H1", "## When to use\n\nAlways.\n"],
    ["with # only in code", "```md\n# Example\n```\n"],
  ])("opens with the documents when the template is %s", (_, template) => {
    expect(buildLlmsFullTxt({ template, documents })).toBe(
      "# Guide\n\n> Start here.\n\n# CLI\n\nRun it.\n",
    );
  });
});
