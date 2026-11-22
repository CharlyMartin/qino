import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { QinoConfigMarker } from "../../data/globals";
import { initQino } from "../../runtime/qino/init-qino";
import type { PagesConfig } from "../../types/pages";
import { writeLlmsTxt } from "./write-llms-txt";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-write-llms-txt-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
  await fs.mkdir(nodePath.join(tmp, "public"));
  await fs.writeFile(nodePath.join(tmp, "llms.md"), "# Site\n");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

type SetupOptions = {
  template?: string;
  sections?: boolean;
  pages?: Partial<PagesConfig>;
};

function setup({ template, sections, pages }: SetupOptions = {}) {
  const qino = initQino({
    contentFolder: tmp,
    mediaFolder: nodePath.join(tmp, "public"),
    siteUrl: "https://example.com",
    cli: {
      build: {
        llmsTxt:
          template == undefined && !sections ? true : { template, sections },
      },
    },
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({ title: z.string() }),
    pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog", ...pages },
  });
  return {
    context: qino[QinoConfigMarker],
    collections: [posts],
    items: [],
    trees: [],
  };
}

async function writePost(slug: string) {
  await fs.writeFile(
    nodePath.join(tmp, "posts", `${slug}.md`),
    `---\ntitle: ${slug}\n---\n`,
  );
}

function readPublic(file: string) {
  return fs.readFile(nodePath.join(tmp, "public", file), "utf8");
}

describe("writeLlmsTxt", () => {
  test("leaves out a collection with nothing to list, and falls back from an empty template path", async () => {
    await writeLlmsTxt(setup({ template: "" }));

    expect(await readPublic("llms.txt")).toBe("# Site\n");
    expect(await readPublic("index.md")).toBe(
      '---\ntitle: "Site"\ncanonical: "https://example.com/"\n---\n\n# Site\n',
    );
  });

  test.each<Partial<PagesConfig>>([
    { index: "/" },
    { index: "/index" },
    { entry: "/{slug}" },
  ])(
    "skips index.md when a page's Markdown URL is /index.md: %j",
    async (pages) => {
      await writePost("index");

      await writeLlmsTxt(setup({ pages }));

      expect(await readPublic("llms.txt")).toContain("## Blog");
      await expect(readPublic("index.md")).rejects.toThrow("ENOENT");
    },
  );

  test("leaves an index.md from an earlier build in place when skipping it", async () => {
    await fs.writeFile(nodePath.join(tmp, "public", "index.md"), "Old.\n");

    await writeLlmsTxt(setup({ pages: { index: "/" } }));

    expect(await readPublic("index.md")).toBe("Old.\n");
  });
  test("with sections, writes a section llms.txt at an index page with a trailing slash, and links it", async () => {
    await writePost("hello");
    await writeLlmsTxt(setup({ sections: true, pages: { index: "/blog/" } }));

    expect(await readPublic("llms.txt")).toBe(
      "# Site\n\n## Sections\n\n- [Blog](https://example.com/blog/llms.txt)\n",
    );
    expect(await readPublic("blog/llms.txt")).toBe(
      "# Blog\n\n- [hello](https://example.com/blog/hello.md)\n",
    );
  });

  test("with sections, writes no section llms.txt and no ## Sections for a collection with nothing to list", async () => {
    await writeLlmsTxt(setup({ sections: true }));

    expect(await readPublic("llms.txt")).toBe("# Site\n");
    await expect(readPublic("blog/llms.txt")).rejects.toThrow("ENOENT");
  });

  test("with sections, fails for an index page at /, naming the collection", async () => {
    await writePost("hello");

    await expect(
      writeLlmsTxt(
        setup({ sections: true, pages: { index: "/", entry: "/{slug}" } }),
      ),
    ).rejects.toThrow(
      'Collection "posts": pages.index is "/", so its section llms.txt would replace llms.txt. Give the index page another path, or turn off `cli.build.llmsTxt.sections`.',
    );
  });
});
