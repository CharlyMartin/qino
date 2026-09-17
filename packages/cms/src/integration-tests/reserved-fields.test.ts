import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { StandardSchemaV1 } from "@standard-schema/spec";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { validateCollection } from "../cli/check/validate-collection";
import { validateItem } from "../cli/check/validate-item";
import { validateTree } from "../cli/check/validate-tree";
import { createQino } from "../runtime/qino/create-qino";

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
        const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
        for (const field of extension == ".json" || source == "transform"
          ? ["_meta"]
          : ["_meta", "markdown"]) {
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
          const file = `/entries/hello${extension}` as const;
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
            directory: "/entries",
            extension,
            schema,
          });
          const item = qino.defineItem({ file, schema });
          const tree = qino.defineTree({
            directory: "/entries",
            extension,
            titleField: "title",
            schema,
          });
          const error = `${filePath}: fields reserved for Qino cannot appear in content or schema output: ${field}.`;
          await expect(collection.getOne("hello")).rejects.toThrow(error);
          await expect(collection.getMany()).rejects.toThrow(error);
          await expect(item.getData()).rejects.toThrow(error);
          await expect(tree.getEntry("hello")).rejects.toThrow(error);
          await expect(validateCollection(collection)).rejects.toThrow(error);
          await expect(validateItem(item)).rejects.toThrow(error);
          await expect(validateTree(tree)).rejects.toThrow(error);
        }
      },
    );
  },
);

test("resolved Markdown targets retain their markdown", async () => {
  await fs.writeFile(
    path.join(tmp, "entries/hello.md"),
    "---\ntitle: Hello\n---\n# Hello",
  );
  await fs.writeFile(
    path.join(tmp, "links.json"),
    JSON.stringify({
      post: "/entries/hello.md",
      home: "/entries/hello.md",
      doc: "/entries/hello.md",
    }),
  );
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const schema = z.strictObject({ title: z.string(), markdown: z.string() });
  const posts = qino.defineCollection({
    directory: "/entries",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "/entries/hello.md", schema });
  const docs = qino.defineTree({
    directory: "/entries",
    extension: ".md",
    titleField: "title",
    schema,
  });
  const links = qino.defineItem({
    file: "/links.json",
    schema: z.object({ post: z.string(), home: z.string(), doc: z.string() }),
    relations: { post: posts, home, doc: docs },
    views: (view) => ({ default: view({ resolveRelations: true }) }),
  });
  const entry = await links.getData();
  for (const target of [entry.post, entry.home, entry.doc]) {
    expect(target.markdown).toBe("# Hello");
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
    const file = `/entries/hello${extension}` as const;
    await fs.writeFile(path.join(tmp, file), raw);
    const schema = z.object({
      title: z.string(),
      body: z.number(),
      ...(extension == ".json" ? {} : { markdown: z.string() }),
    });
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const posts = qino.defineCollection({
      directory: "/entries",
      extension,
      schema,
    });
    const home = qino.defineItem({ file, schema });
    const docs = qino.defineTree({
      directory: "/entries",
      extension,
      titleField: "title",
      schema,
    });
    const entries = await Promise.all([
      posts.getOne("hello"),
      home.getData(),
      docs.getEntry("hello"),
    ]);
    for (const entry of entries) {
      expect(entry.body).toBe(42);
      if (extension == ".json") expect(entry).not.toHaveProperty("markdown");
      else expect(entry).toHaveProperty("markdown", "# Hello");
    }
  },
);

test.each(["_meta", "markdown"])(
  "augmentation cannot overwrite generated %s",
  async (field) => {
    await fs.writeFile(
      path.join(tmp, "home.md"),
      "---\ntitle: Hello\n---\n# Hello",
    );
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const item = qino.defineItem({
      file: "/home.md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({
          // @ts-expect-error Exercise runtime protection when type checks are bypassed.
          augment: () => ({ [field]: "conflict" }),
        }),
      }),
    });
    await expect(item.getData()).rejects.toThrow(
      `augment cannot add reserved or overwrite existing fields: ${field}.`,
    );
  },
);

test("JSON markdown and nested reserved names remain user fields", async () => {
  const data = {
    markdown: 42,
    nested: { _meta: "custom", markdown: "custom" },
  };
  await fs.writeFile(path.join(tmp, "home.json"), JSON.stringify(data));
  const item = createQino({ contentFolder: tmp, mediaFolder: tmp }).defineItem({
    file: "/home.json",
    schema: z.object({
      markdown: z.number(),
      nested: z.object({ _meta: z.string(), markdown: z.string() }),
    }),
  });
  await expect(item.getData()).resolves.toMatchObject(data);
});

test.each([".md", ".mdx", ".markdown"] as const)(
  "getters and CLI accept transformed markdown in %s",
  async (extension) => {
    await fs.writeFile(
      path.join(tmp, `entries/hello${extension}`),
      "---\ntitle: Hello\n---\n# Hello",
    );
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const schema = z.object({
      title: z.string(),
      markdown: z.string().transform((text) => text.length),
    });
    const item = qino.defineItem({
      file: `/entries/hello${extension}`,
      schema,
    });
    const collection = qino.defineCollection({
      directory: "/entries",
      extension,
      schema,
    });
    const tree = qino.defineTree({
      directory: "/entries",
      extension,
      titleField: "title",
      schema,
    });
    for (const entry of await Promise.all([
      item.getData(),
      collection.getOne("hello"),
      tree.getEntry("hello"),
    ])) {
      expect(entry.markdown).toBe(7);
      expect(entry._meta.filePath).toBe(
        path.join(tmp, `entries/hello${extension}`),
      );
    }
    await validateItem(item);
    await validateCollection(collection);
    await validateTree(tree);
  },
);
