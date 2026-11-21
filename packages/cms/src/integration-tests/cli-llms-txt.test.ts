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

test("build writes llms.txt and index.md from the template, with a section per tree root, collection and the items", async () => {
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
  expect(await readPublic("index.md")).toBe(llmsTxt);
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
