import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { StandardSchemaV1 } from "@standard-schema/spec";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { validateCollection } from "../cli/check/validate-collection";
import { validateItem } from "../cli/check/validate-item";
import { validateTree } from "../cli/check/validate-tree";
import { initQino } from "../runtime/qino/init-qino";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-reserved-"));
  await fs.mkdir(path.join(tmp, "entries"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe.each([".md", ".mdx", ".markdown", ".json"] as const)(
  "%s entries",
  (extension) => {
    test.each(["content", "transform"])(
      "rejects reserved fields from %s in getters and CLI validation",
      async (source) => {
        const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
        for (const field of extension == ".json"
          ? ["_meta"]
          : ["_meta", "markdown", "raw"]) {
          const data = {
            title: "Hello",
            ...(source == "content" ? { [field]: "conflict" } : {}),
          };
          const raw =
            extension == ".json"
              ? JSON.stringify(data)
              : `---\n${Object.entries(data)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n")}\n---\n# Hello`;
          const file = `entries/hello${extension}` as const;
          const filePath = path.join(tmp, file);
          await fs.writeFile(filePath, raw);
          // Erase the schema type to exercise the JavaScript/runtime fallback.
          const schema: StandardSchemaV1<unknown, { title: string }> =
            source == "content"
              ? z.object({ title: z.string() })
              : z
                  .object({ title: z.string() })
                  .transform((entry) => ({ ...entry, [field]: "conflict" }));
          const collection = qino.defineCollection({
            directory: "entries",
            extension,
            schema,
          });
          const item = qino.defineItem({ file, schema });
          const tree = qino.defineTree({
            directory: "entries",
            extension,
            titleField: "title",
            schema,
          });
          const error = `${filePath}: fields reserved for Qino cannot appear in content or schema output: ${field}.`;
          await expect(collection.getEntry("hello")).rejects.toThrow(error);
          await expect(collection.getEntries()).rejects.toThrow(error);
          await expect(item.getEntry()).rejects.toThrow(error);
          await expect(tree.getEntry("hello")).rejects.toThrow(error);
          await expect(validateCollection(collection)).rejects.toThrow(error);
          await expect(validateItem(item)).rejects.toThrow(error);
          await expect(validateTree(tree)).rejects.toThrow(error);
        }
      },
    );
  },
);

test("resolved Markdown targets retain their markdown and raw", async () => {
  const raw = "---\ntitle: Hello\n---\n# Hello";
  await fs.writeFile(path.join(tmp, "entries/hello.md"), raw);
  await fs.writeFile(
    path.join(tmp, "links.json"),
    JSON.stringify({
      post: "entries/hello.md",
      home: "entries/hello.md",
      doc: "entries/hello.md",
    }),
  );
  const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
  const schema = z.strictObject({ title: z.string() });
  const posts = qino.defineCollection({
    directory: "entries",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "entries/hello.md", schema });
  const docs = qino.defineTree({
    directory: "entries",
    extension: ".md",
    titleField: "title",
    schema,
  });
  const links = qino.defineItem({
    file: "links.json",
    schema: z.object({ post: z.string(), home: z.string(), doc: z.string() }),
    relations: { post: posts, home, doc: docs },
    views: (view) => ({ default: view({ resolveRelations: true }) }),
  });
  const entry = await links.getEntry();
  for (const target of [entry.post, entry.home, entry.doc]) {
    expect(target.markdown).toBe("# Hello");
    expect(target.raw).toBe(raw);
    expect(target).not.toHaveProperty("body");
    expect(target._meta.filePath).toBe(path.join(tmp, "entries/hello.md"));
  }
});

test.each([".md", ".mdx", ".markdown", ".json"] as const)(
  "body remains user-defined in %s entries",
  async (extension) => {
    const raw =
      extension == ".json"
        ? JSON.stringify({ title: "Hello", body: 42 })
        : "---\ntitle: Hello\nbody: 42\n---\n# Hello";
    const file = `entries/hello${extension}` as const;
    await fs.writeFile(path.join(tmp, file), raw);
    const schema = z.object({ title: z.string(), body: z.number() });
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const posts = qino.defineCollection({
      directory: "entries",
      extension,
      schema,
    });
    const home = qino.defineItem({ file, schema });
    const docs = qino.defineTree({
      directory: "entries",
      extension,
      titleField: "title",
      schema,
    });
    const entries = await Promise.all([
      posts.getEntry("hello"),
      home.getEntry(),
      docs.getEntry("hello"),
    ]);
    for (const entry of entries) {
      expect(entry.body).toBe(42);
      if (extension == ".json") expect(entry).not.toHaveProperty("markdown");
      else expect(entry).toHaveProperty("markdown", "# Hello");
    }
  },
);

test.each(["_meta", "markdown", "raw"])(
  "augmentation cannot overwrite generated %s",
  async (field) => {
    await fs.writeFile(
      path.join(tmp, "home.md"),
      "---\ntitle: Hello\n---\n# Hello",
    );
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const item = qino.defineItem({
      file: "home.md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({
          // @ts-expect-error Exercise runtime protection when type checks are bypassed.
          augment: () => ({ [field]: "conflict" }),
        }),
      }),
    });
    await expect(item.getEntry()).rejects.toThrow(
      `augment cannot add reserved or overwrite existing fields: ${field}.`,
    );
  },
);

test("JSON markdown, raw and nested reserved names remain user fields", async () => {
  const data = {
    markdown: 42,
    raw: true,
    nested: { _meta: "custom", markdown: "custom", raw: "custom" },
  };
  await fs.writeFile(path.join(tmp, "home.json"), JSON.stringify(data));
  const item = initQino({ contentFolder: tmp, mediaFolder: tmp }).defineItem({
    file: "home.json",
    schema: z.object({
      markdown: z.number(),
      raw: z.boolean(),
      nested: z.object({
        _meta: z.string(),
        markdown: z.string(),
        raw: z.string(),
      }),
    }),
  });
  await expect(item.getEntry()).resolves.toMatchObject(data);
});

test.each([".md", ".mdx", ".markdown"] as const)(
  "getters and CLI accept an empty schema for %s without frontmatter",
  async (extension) => {
    await fs.writeFile(path.join(tmp, `entries/hello${extension}`), "# Hello");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const schema = z.strictObject({});
    const item = qino.defineItem({
      file: `entries/hello${extension}`,
      schema,
    });
    const collection = qino.defineCollection({
      directory: "entries",
      extension,
      schema,
    });
    for (const entry of await Promise.all([
      item.getEntry(),
      collection.getEntry("hello"),
    ])) {
      expect(entry).toEqual({
        markdown: "# Hello",
        raw: "# Hello",
        _meta: expect.objectContaining({
          filePath: path.join(tmp, `entries/hello${extension}`),
        }),
      });
    }
    await validateItem(item);
    await validateCollection(collection);
  },
);
