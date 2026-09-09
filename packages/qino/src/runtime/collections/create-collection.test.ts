import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { createQino } from "../qino/create-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-collection-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("createCollection", () => {
  test("adds derived fields using the entry body and metadata", async () => {
    const posts = nodePath.join(tmp, "posts");
    await fs.mkdir(posts);
    await fs.writeFile(
      nodePath.join(posts, "hello.md"),
      ["---", "title: Hello", "---", "", "One two three"].join("\n"),
    );

    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.createCollection({
      directory: "/posts",
      schema: z
        .object({ title: z.string(), [MARKDOWN_BODY_FIELD_NAME]: z.string() })
        .strict(),
      extension: ".md",
      augment: ({ body, _meta }) => ({
        words: body.trim().split(/\s+/u).length,
        sourceFile: _meta.fileName,
      }),
    });

    await expect(collection.getOne("hello")).resolves.toMatchObject({
      words: 3,
      sourceFile: "hello.md",
    });
  });
});

async function writeMd(relPath: string, title: string) {
  const filePath = nodePath.join(tmp, "posts", relPath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    ["---", `title: ${title}`, "---", "", `# ${title}`].join("\n"),
  );
}

function makeCollection() {
  const { createCollection } = createQino({
    contentFolder: tmp,
    mediaFolder: tmp,
  });
  return createCollection({
    directory: "/posts",
    schema: z.object({
      title: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    }),
    extension: ".md",
  });
}

describe("getAllSlugs", () => {
  test("returns each entry's slug, sorted", async () => {
    await writeMd("second.md", "Second");
    await writeMd("first.md", "First");

    expect(await makeCollection().getAllSlugs()).toEqual(["first", "second"]);
  });

  test("ignores files in subdirectories (collections are flat)", async () => {
    await writeMd("first.md", "First");
    await writeMd("guides/intro.md", "Intro");

    expect(await makeCollection().getAllSlugs()).toEqual(["first"]);
  });

  test("returns an empty array for an empty collection", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"), { recursive: true });

    expect(await makeCollection().getAllSlugs()).toEqual([]);
  });

  test("returns an empty array for a missing directory", async () => {
    expect(await makeCollection().getAllSlugs()).toEqual([]);
  });

  test("ignores hidden files", async () => {
    await writeMd(".hidden.md", "Hidden");
    await writeMd("visible.md", "Visible");

    expect(await makeCollection().getAllSlugs()).toEqual(["visible"]);
  });

  test.each([
    ".md",
    ".mdx",
    ".markdown",
    ".json",
  ] as const)("filters by %s and strips only the trailing extension", async (extension) => {
    for (const ext of [".md", ".mdx", ".markdown", ".json", ".txt"]) {
      await writeMd(`post${ext}`, "Post");
    }
    await writeMd(`release.v1${extension}${extension}`, "Release");
    await writeMd(`backup${extension}.bak`, "Backup");
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.createCollection({
      directory: "/posts",
      extension,
      schema: z.object({ title: z.string() }),
    });

    expect(await collection.getAllSlugs()).toEqual([
      "post",
      `release.v1${extension}`,
    ]);
  });

  test("includes malformed and schema-invalid content", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(nodePath.join(tmp, "posts/malformed.json"), "{");
    await fs.writeFile(nodePath.join(tmp, "posts/invalid.json"), "{}");
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.createCollection({
      directory: "/posts",
      extension: ".json",
      schema: z.object({ title: z.string() }),
    });

    expect(await collection.getAllSlugs()).toEqual(["invalid", "malformed"]);
    await expect(collection.getOne("malformed")).rejects.toThrow();
    await expect(collection.getOne("invalid")).rejects.toThrow();
  });

  test("never reads content, validates schemas, resolves relations, or runs augment", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(
      nodePath.join(tmp, "posts/hello.json"),
      JSON.stringify({ title: "Hello", author: "/authors/alice.json" }),
    );
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const authors = qino.createCollection({
      directory: "/authors",
      extension: ".json",
      schema: z.object({ name: z.string() }),
    });
    const validate = vi.fn(() => {
      throw new Error("Schema must not run");
    });
    const relation = vi.fn(() => authors);
    const augment = vi.fn(() => {
      throw new Error("Augment must not run");
    });
    const collection = qino.createCollection({
      directory: "/posts",
      extension: ".json",
      schema: z
        .object({ title: z.string(), author: z.string() })
        .superRefine(validate),
      relations: { author: relation },
      resolveRelations: true,
      augment,
      views: { detail: { resolveRelations: true, augment } },
    });
    const readFile = vi
      .spyOn(fs, "readFile")
      .mockRejectedValue(new Error("Content must not be read"));

    expect(await collection.getAllSlugs()).toEqual(["hello"]);
    expect(readFile).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(relation).not.toHaveBeenCalled();
    expect(augment).not.toHaveBeenCalled();
  });
});
