import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { QinoConfigMarker } from "../../data/globals";
import { initQino, type QinoConfig } from "../../runtime/qino/init-qino";
import { writeLlmsTxt } from "./write-llms-txt";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-write-llms-txt-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
  await fs.writeFile(nodePath.join(tmp, "llms.md"), "# Site\n");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup(cli: QinoConfig["cli"], index: "/" | "/blog" = "/blog") {
  const qino = initQino({
    contentFolder: tmp,
    mediaFolder: nodePath.join(tmp, "public"),
    siteUrl: "https://example.com",
    cli,
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({ title: z.string() }),
    pages: { index, entry: "/blog/{slug}", title: "Blog" },
  });
  return {
    context: qino[QinoConfigMarker],
    collections: [posts],
    items: [],
    trees: [],
  };
}

function readPublic(file: string) {
  return fs.readFile(nodePath.join(tmp, "public", file), "utf8");
}

describe("writeLlmsTxt", () => {
  test("writes nothing when llmsTxt is off", async () => {
    await writeLlmsTxt(setup({ build: { llmsTxt: false } }));

    await expect(readPublic("llms.txt")).rejects.toThrow("ENOENT");
  });

  test("leaves out a collection with nothing to list", async () => {
    await writeLlmsTxt(setup({ build: { llmsTxt: { template: "" } } }));

    expect(await readPublic("llms.txt")).toBe("# Site\n");
    expect(await readPublic("index.md")).toBe("# Site\n");
  });

  test("skips index.md when a collection's index page is the site root", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "posts", "hello.md"),
      "---\ntitle: Hello\n---\n",
    );

    await writeLlmsTxt(setup({ build: { llmsTxt: true } }, "/"));

    expect(await readPublic("llms.txt")).toBe(
      "# Site\n\n## Blog\n\n- [Hello](https://example.com/blog/hello.md)\n",
    );
    await expect(readPublic("index.md")).rejects.toThrow("ENOENT");
  });
});
