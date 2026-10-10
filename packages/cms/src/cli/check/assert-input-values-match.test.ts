import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { assertInputValuesMatch } from "./assert-input-values-match";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-input-values-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(relativePath: string, content: string) {
  const filePath = nodePath.join(tmp, relativePath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function setup() {
  const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.defineCollection({
    directory: "authors",
    schema: z.object({ name: z.string() }),
    extension: ".json",
  });
  return { qino, authors };
}

describe("assertInputValuesMatch", () => {
  test("passes when transforms keep relation values", async () => {
    const { qino, authors } = setup();
    await write("posts/hello.md", "---\nauthor: ada\nupdated-on: today\n---\n");
    const posts = qino.defineCollection({
      directory: "posts",
      schema: z
        .object({ author: z.string(), "updated-on": z.string() })
        .transform((post) => ({
          author: post.author,
          updatedOn: post["updated-on"],
        })),
      extension: ".md",
      relations: { author: authors },
    });

    await expect(assertInputValuesMatch(posts)).resolves.toBeUndefined();
  });

  test("throws when a transform maps another field onto a relation", async () => {
    const { qino, authors } = setup();
    await write(
      "posts/hello.md",
      "---\nauthor_ref: ada\nauthor: Ada Lovelace\n---\n",
    );
    const posts = qino.defineCollection({
      directory: "posts",
      schema: z
        .object({ author_ref: z.string(), author: z.string() })
        .transform(({ author_ref, author }) => ({
          author: author_ref,
          author_name: author,
        })),
      extension: ".md",
      relations: { author: authors },
    });

    await expect(assertInputValuesMatch(posts)).rejects.toThrow(
      /Relation "author" of "posts" has a different value on disk than after validation in ".*hello\.md"/,
    );
  });

  test("throws when a transform changes a relation from null to undefined", async () => {
    const { qino, authors } = setup();
    await write("home.json", '{ "author": null }');
    const home = qino.defineItem({
      file: "home.json",
      schema: z.object({
        author: z
          .string()
          .nullable()
          .transform((author) => author ?? undefined),
      }),
      relations: { author: authors },
    });

    await expect(assertInputValuesMatch(home)).rejects.toThrow(
      /Relation "author" of "home.json" has a different value on disk than after validation/,
    );
  });

  test("checks array relations of items", async () => {
    const { qino, authors } = setup();
    await write("home.json", '{ "authors": ["ada", "grace"] }');
    const home = qino.defineItem({
      file: "home.json",
      schema: z
        .object({ authors: z.array(z.string()) })
        .transform(({ authors }) => ({ authors: authors.toReversed() })),
      relations: { "authors[*]": authors },
    });

    await expect(assertInputValuesMatch(home)).rejects.toThrow(
      /Relation "authors\[\*\]" of "home.json"/,
    );
  });

  test("throws when a transform changes the titleField of a tree", async () => {
    const { qino } = setup();
    await write("docs/intro.md", "---\ntitle: Intro\nlabel: Start here\n---\n");
    const docs = qino.defineTree({
      directory: "docs",
      schema: z
        .object({ title: z.string(), label: z.string() })
        .transform(({ label }) => ({ title: label })),
      extension: ".md",
      titleField: "title",
    });

    await expect(assertInputValuesMatch(docs)).rejects.toThrow(
      /titleField "title" of "docs" has a different value on disk/,
    );
  });

  test("skips primitives without relations or titleField", async () => {
    const { authors } = setup();
    await write("authors/ada.json", '{ "name": "Ada" }');

    await expect(assertInputValuesMatch(authors)).resolves.toBeUndefined();
  });
});
