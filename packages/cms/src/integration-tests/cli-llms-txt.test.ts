import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { createLlmsTxtProject } from "./create-llms-txt-project";
import { runQinoBuild } from "./run-qino-build";

const config = `{
  contentFolder: "content",
  mediaFolder: "public",
  siteUrl: "https://example.com",
  cli: { build: { llmsTxt: true } },
}`;

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-cli-llms-txt-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function build() {
  return runQinoBuild(tmp);
}

function readPublic(file: string) {
  return fs.readFile(path.join(tmp, "public", file), "utf8");
}

test("build writes llms.txt from the template, with a section per tree root, collection and the items, index.md with a frontmatter block before it, and llms-full.txt with their entry pages", async () => {
  await createLlmsTxtProject(tmp, { config });

  await build();

  const llmsTxt = await readPublic("llms.txt");
  expect(llmsTxt).toBe(
    [
      "# Example",
      "",
      "> A site.",
      "",
      "## When to use",
      "",
      "Always.",
      "",
      "## API",
      "",
      "- [API](https://example.com/docs/api.md): Reference.",
      "",
      "## Guide",
      "",
      "- [Guide](https://example.com/docs/guide.md): Start here.",
      "- [CLI](https://example.com/docs/guide/cli.md): Commands.",
      "",
      "## Notes",
      "",
      "- [One](https://example.com/notes/one.md)",
      "",
      "## Blog",
      "",
      "- [Hello](https://example.com/blog/hello.md): The first post.",
      "- [World](https://example.com/blog/world.md)",
      "",
      "## Pages",
      "",
      "- [About](https://example.com/about.md): Who we are.",
      "",
      "## Optional",
      "",
      "- [GitHub](https://github.com/example): Source",
      "",
    ].join("\n"),
  );
  expect(await readPublic("index.md")).toBe(
    `---\ntitle: "Example"\ndescription: "A site."\ncanonical: "https://example.com/"\n---\n\n${llmsTxt}`,
  );
  expect(await readPublic("llms-full.txt")).toBe(
    [
      "# Example",
      "",
      "> A site.",
      "",
      "# API",
      "",
      "> Reference.",
      "",
      "# Guide",
      "",
      "> Start here.",
      "",
      "# CLI",
      "",
      "> Commands.",
      "",
      "# Hello",
      "",
      "> The first post.",
      "",
      "See [the guide](https://example.com/docs/guide).",
      "",
      "# World",
      "",
      "# About",
      "",
      "> Who we are.",
      "",
    ].join("\n"),
  );
}, 60_000);

test("build appends the sections to a template without ## Optional, and skips index.md when an item is the homepage", async () => {
  await createLlmsTxtProject(tmp, {
    config: config.replace(
      "llmsTxt: true",
      'llmsTxt: { template: "agents/llms.md" }',
    ),
    files: {
      "content/agents/llms.md": "# Example\r\n\r\n> A site.\r\n",
      "qino/about.ts": `
        import { z } from "zod";
        import qino from "./index";
        export const about = qino.defineItem({
          file: "about.md",
          schema: z.object({ title: z.string(), description: z.string() }),
          page: "/",
        });
      `,
    },
  });

  const { stdout } = await build();

  const llmsTxt = await readPublic("llms.txt");
  expect(llmsTxt).toMatch(/^# Example\n\n> A site\.\n\n## API\n/);
  expect(llmsTxt).toMatch(
    /## Pages\n\n- \[About\]\(https:\/\/example\.com\/index\.md\): Who we are\.\n$/,
  );
  await expect(readPublic("index.md")).rejects.toThrow("ENOENT");
  expect(stdout).toContain("index.md skipped");

  const llmsFullTxt = await readPublic("llms-full.txt");
  expect(llmsFullTxt).toMatch(/^# Example\n\n> A site\.\n\n# API\n/);
  expect(llmsFullTxt).toMatch(/\n\n# About\n\n> Who we are\.\n$/);
}, 60_000);

test.each([
  ["no H1, so no block", "Notes for agents.\n\n## Optional\n", undefined],
  ["a blank H1, so no block", "# {#top}\n\n> A site.\n", undefined],
  [
    "an H1 and no summary, so a title as plain text and no description",
    "# The *Example* site[^1] {#top}\n\nAn intro.\n\n[^1]: A note.\n",
    '---\ntitle: "The Example site"\ncanonical: "https://example.com/"\n---',
  ],
  [
    "a summary on several lines, so a description on one, its links absolute",
    "# Example\n\n<!-- For agents. -->\n\n> A site,\n> with [docs](/docs).\n",
    '---\ntitle: "Example"\ndescription: "A site, with [docs](https://example.com/docs)."\ncanonical: "https://example.com/"\n---',
  ],
])(
  "build writes index.md from a template with %s",
  async (_, template, block) => {
    await createLlmsTxtProject(tmp, {
      config,
      files: { "content/llms.md": template },
    });

    await build();

    const llmsTxt = await readPublic("llms.txt");
    expect(await readPublic("index.md")).toBe(
      block ? `${block}\n\n${llmsTxt}` : llmsTxt,
    );
  },
  60_000,
);

test("build with sections writes a section llms.txt per tree and collection, and llms.txt links them in place of their sections", async () => {
  await createLlmsTxtProject(tmp, {
    config: config.replace("llmsTxt: true", "llmsTxt: { sections: true }"),
  });

  await build();

  expect(await readPublic("llms.txt")).toBe(
    [
      "# Example",
      "",
      "> A site.",
      "",
      "## When to use",
      "",
      "Always.",
      "",
      "## Sections",
      "",
      "- [Docs](https://example.com/docs/llms.txt)",
      "- [Notes](https://example.com/notes/llms.txt)",
      "- [Blog](https://example.com/blog/llms.txt)",
      "",
      "## Pages",
      "",
      "- [About](https://example.com/about.md): Who we are.",
      "",
      "## Optional",
      "",
      "- [GitHub](https://github.com/example): Source",
      "",
    ].join("\n"),
  );
  expect(await readPublic("docs/llms.txt")).toBe(
    [
      "# Docs",
      "",
      "## API",
      "",
      "- [API](https://example.com/docs/api.md): Reference.",
      "",
      "## Guide",
      "",
      "- [Guide](https://example.com/docs/guide.md): Start here.",
      "- [CLI](https://example.com/docs/guide/cli.md): Commands.",
      "",
    ].join("\n"),
  );
  expect(await readPublic("blog/llms.txt")).toBe(
    "# Blog\n\n- [Hello](https://example.com/blog/hello.md): The first post.\n- [World](https://example.com/blog/world.md)\n",
  );
  expect(await readPublic("notes/llms.txt")).toBe(
    "# Notes\n\n- [One](https://example.com/notes/one.md)\n",
  );
  expect(await readPublic("llms-full.txt")).toMatch(
    /^# Example\n\n> A site\.\n\n# API\n/,
  );
}, 60_000);

test("build fails when llmsTxt has no siteUrl", async () => {
  await createLlmsTxtProject(tmp, {
    config: config.replace('siteUrl: "https://example.com",', ""),
    files: {
      // Pages need a siteUrl too, so only the snippets stay.
      "qino/docs.ts": "",
      "qino/posts.ts": "",
      "qino/notes.ts": "",
      "qino/about.ts": "",
    },
  });

  await expect(build()).rejects.toThrow(
    '`cli.build.llmsTxt` needs a siteUrl: set one in initQino, such as "https://example.com".',
  );
}, 60_000);

test("build fails without the template, naming the file to create", async () => {
  await createLlmsTxtProject(tmp, { config });
  await fs.rm(path.join(tmp, "content/llms.md"));

  await expect(build()).rejects.toThrow(
    'The llms.txt template "content/llms.md" doesn\'t exist.',
  );
  await expect(readPublic("llms.txt")).rejects.toThrow("ENOENT");
}, 60_000);
