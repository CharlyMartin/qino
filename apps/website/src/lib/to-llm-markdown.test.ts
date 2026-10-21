import { expect, test } from "vitest";

import { toLlmMarkdown } from "./to-llm-markdown";

const frontmatter = "---\ntitle: Guide\ndescription: Install qino.\n---\n\n";

test("keeps the frontmatter", () => {
  expect(toLlmMarkdown({ raw: `${frontmatter}Body.`, links: [] })).toBe(
    `${frontmatter}Body.\n`,
  );
});

test("replaces LinkGrid with a list of child Markdown pages", () => {
  const markdown = toLlmMarkdown({
    raw: `${frontmatter}<LinkGrid />`,
    links: [{ slug: "guide/cli", title: "CLI", description: "Run the CLI." }],
  });
  expect(markdown).toContain(
    "- [CLI](https://www.qino.works/docs/guide/cli.md): Run the CLI.",
  );
});

test("replaces InstallBox with an npm command", () => {
  const markdown = toLlmMarkdown({
    raw: '<InstallBox />\n\n<InstallBox command="build" />',
    links: [],
  });
  expect(markdown).toContain("```sh\nnpm install @qino/cms zod\n```");
  expect(markdown).toContain("```sh\nnpx qino build\n```");
});

test("makes site-relative links absolute", () => {
  const markdown = toLlmMarkdown({
    raw: "See [Trees](/docs/concepts/trees) and [MDN](https://mdn.dev).",
    links: [],
  });
  expect(markdown).toContain(
    "[Trees](https://www.qino.works/docs/concepts/trees)",
  );
  expect(markdown).toContain("[MDN](https://mdn.dev)");
});
