import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { readValidatedEntries } from "./read-validated-entries";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-validated-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(relativePath: string, content: string) {
  const filePath = nodePath.join(tmp, relativePath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

const qino = () => initQino({ contentFolder: tmp, mediaFolder: tmp });
const schema = z.object({ title: z.string() }).transform(({ title }) => ({
  title: title.toUpperCase(),
}));

describe("readValidatedEntries", () => {
  test("reads every collection entry through the schema", async () => {
    await write("posts/a.md", "---\ntitle: a\n---\n");
    await write("posts/b.md", "---\ntitle: b\n---\n");
    const posts = qino().defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });

    const entries = await readValidatedEntries(posts);

    expect(entries.map(({ title }) => title).sort()).toEqual(["A", "B"]);
    expect(entries[0]?._meta.filePath).toContain(nodePath.join(tmp, "posts"));
  });

  test("reads the item entry", async () => {
    await write("home.json", JSON.stringify({ title: "home" }));
    const home = qino().defineItem({ file: "home.json", schema });

    const entries = await readValidatedEntries(home);

    expect(entries.map(({ title }) => title)).toEqual(["HOME"]);
    expect(entries[0]?._meta.filePath).toBe(nodePath.join(tmp, "home.json"));
  });

  test("reads every tree node", async () => {
    await write("docs/guide.md", "---\ntitle: guide\n---\n");
    await write("docs/guide/setup.md", "---\ntitle: setup\n---\n");
    const docs = qino().defineTree({
      directory: "docs",
      schema,
      extension: ".md",
      titleField: "title",
    });

    const entries = await readValidatedEntries(docs);

    expect(entries.map(({ title }) => title).sort()).toEqual([
      "GUIDE",
      "SETUP",
    ]);
  });
});
