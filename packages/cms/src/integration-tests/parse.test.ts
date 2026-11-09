import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { findMediaViolations } from "../cli/check/find-media-violations";
import type { MediaParse, RelationParse } from "../index";
import { initQino } from "../runtime/qino/init-qino";

// An Obsidian-style vault: notes link with `[[Name]]`, files sit in
// `attachments/`.
let vault: string;
let attachments: string;

beforeEach(async () => {
  vault = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-parse-int-"));
  attachments = nodePath.join(vault, "attachments");
  await fs.mkdir(nodePath.join(vault, "posts"), { recursive: true });
  await fs.mkdir(nodePath.join(vault, "authors"));
  await fs.mkdir(attachments);
  await sharp({
    create: { width: 32, height: 16, channels: 3, background: "#00f" },
  }).toFile(nodePath.join(attachments, "my cover.png"));
  await fs.writeFile(nodePath.join(attachments, "guide.pdf"), "%PDF-1.4");
  await fs.writeFile(
    nodePath.join(vault, "authors", "Jane Doe.md"),
    "---\nname: Jane Doe\n---\n",
  );
  await fs.writeFile(
    nodePath.join(vault, "authors", "camille.md"),
    "---\nname: Camille\n---\n",
  );
  await fs.writeFile(
    nodePath.join(vault, "posts", "hello.md"),
    '---\ntitle: Hello\nauthor: "[[Jane Doe]]"\ncover: "[[my cover.png]]"\nguide: "[[guide.pdf]]"\n---\n\nBody',
  );
  await fs.writeFile(
    nodePath.join(vault, "posts", "qino-format.md"),
    "---\ntitle: Written by the cloud UI\nauthor: authors/camille.md\ncover: /my%20cover.png\nguide: /guide.pdf\n---\n\nBody",
  );
});

afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

const toWikilinkName = (value: string) => /^\[\[(.+)\]\]$/.exec(value)?.[1];

const parseNote: RelationParse = (value, { target }) => {
  const name = toWikilinkName(value);
  if (!name || target.is == "item") return undefined;
  return `${target.directory}/${name}${target.extension}`;
};

const parseAttachment: MediaParse = (value) => {
  const name = toWikilinkName(value);
  return name ? `/${encodeURIComponent(name)}` : undefined;
};

function setup(guideParse: MediaParse = parseAttachment) {
  const qino = initQino({ contentFolder: vault, mediaFolder: attachments });
  const authors = qino.defineCollection({
    directory: "authors",
    extension: ".md",
    schema: z.object({ name: z.string() }),
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({
      title: z.string(),
      author: z.string(),
      cover: z.string(),
      guide: z.string(),
    }),
    relations: { author: { target: authors, parse: parseNote } },
    media: {
      cover: { accepted: "image/png", maxSize: "1MB", parse: parseAttachment },
      guide: { accepted: "application/pdf", maxSize: "1MB", parse: guideParse },
    },
  });

  return { posts };
}

describe("parse", () => {
  test("reads wikilinks as relations and media", async () => {
    const { posts } = setup();

    expect(await posts.getEntry("hello")).toMatchObject({
      author: { name: "Jane Doe", _meta: { slug: "Jane Doe" } },
      cover: { src: "/my%20cover.png", width: 32, height: 16 },
      guide: "/guide.pdf",
    });
  });

  test("sourceFilePath is the file holding the value, not the target", async () => {
    await fs.writeFile(
      nodePath.join(vault, "authors", "Jane Doe.md"),
      '---\nname: Jane Doe\nmentor: "[[camille]]"\n---\n',
    );
    const sources: Array<[string, string]> = [];
    const recordNote: RelationParse = (value, ctx) => {
      sources.push([value, ctx.sourceFilePath]);
      return parseNote(value, ctx);
    };
    const qino = initQino({ contentFolder: vault, mediaFolder: attachments });
    const authors = qino.defineCollection({
      directory: "authors",
      extension: ".md",
      schema: z.object({ name: z.string(), mentor: z.string().optional() }),
      relations: { mentor: { target: () => authors, parse: recordNote } },
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string(), author: z.string() }),
      relations: {
        author: { target: authors, parse: recordNote, resolveDepth: 2 },
      },
    });

    expect(await posts.getEntry("hello")).toMatchObject({
      author: { name: "Jane Doe", mentor: { name: "Camille" } },
    });
    expect(sources).toEqual([
      ["[[Jane Doe]]", nodePath.join(vault, "posts", "hello.md")],
      ["[[camille]]", nodePath.join(vault, "authors", "Jane Doe.md")],
    ]);
  });

  test("still reads values in qino's format", async () => {
    const { posts } = setup();

    expect(await posts.getEntry("qino-format")).toMatchObject({
      author: { name: "Camille" },
      cover: { src: "/my%20cover.png" },
      guide: "/guide.pdf",
    });
  });

  test("qino check checks the parsed URLs", async () => {
    const { posts } = setup();

    expect(await findMediaViolations(posts, attachments)).toEqual([]);
  });

  test("qino check reports a parsed URL that breaks a rule", async () => {
    const { posts } = setup((value) =>
      value == "[[guide.pdf]]" ? "/missing.pdf" : undefined,
    );

    expect(await findMediaViolations(posts, attachments)).toEqual([
      expect.objectContaining({
        location: "guide",
        url: "/missing.pdf",
        reason: `doesn't exist in "${attachments}".`,
      }),
    ]);
  });
});
