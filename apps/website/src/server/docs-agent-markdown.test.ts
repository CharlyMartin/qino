import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";

test("a section landing's LinkGrid lists its pages with their Markdown URLs", async () => {
  const markdown = await docsTree.getAgentMarkdown("guide");

  expect(markdown).toBe(
    [
      "# Guide",
      "",
      "> Install qino, lay out a project, and run the CLI.",
      "",
      "- [Philosophy](https://www.qino.works/docs/guide/philosophy.md): Why qino is a flat-file CMS and what it deliberately leaves out.",
      "- [Installation](https://www.qino.works/docs/guide/installation.md): Add @qino/cms to a project and create a first collection.",
      "- [Project structure](https://www.qino.works/docs/guide/project-structure.md): The qino/ folder, the entry file, and where definitions live.",
      "- [Content folder](https://www.qino.works/docs/guide/content-folder.md): Allowed file types and how collections, trees, and items are laid out on disk.",
      "- [Frontmatter](https://www.qino.works/docs/guide/frontmatter.md): How YAML frontmatter is parsed and which values become which types.",
      "- [CLI](https://www.qino.works/docs/guide/cli.md): The qino command, what each subcommand checks, and how to wire it into a build.",
      "- [Cloud](https://www.qino.works/docs/guide/cloud.md): Configure how the qino cloud UI publishes, searches, sorts, hides fields, and saves uploads.",
      "",
    ].join("\n"),
  );
});

test("InstallBox becomes its npm command, install by default", async () => {
  const markdown = await docsTree.getAgentMarkdown("guide/installation");

  expect(markdown).toContain("```sh\nnpm install @qino/cms zod\n```");
  expect(markdown).toContain(
    "```sh\nnpx skills add CharlyMartin/qino --skill set-up-qino-cms\n```",
  );
  expect(markdown).not.toContain("<InstallBox");
});
