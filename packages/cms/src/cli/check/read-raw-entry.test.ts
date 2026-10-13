import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { readRawEntry } from "./read-raw-entry";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-raw-entry-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const schema = z
  .object({ "author-ref": z.string() })
  .transform((data) => ({ author: data["author-ref"] }));

describe("readRawEntry", () => {
  test("returns Markdown frontmatter as it is on disk", async () => {
    const filePath = nodePath.join(tmp, "post.md");
    await fs.writeFile(filePath, "---\nauthor-ref: ada\n---\n\nBody\n");

    expect(await readRawEntry(schema, filePath)).toMatchObject({
      "author-ref": "ada",
    });
  });

  test("returns JSON as it is on disk", async () => {
    const filePath = nodePath.join(tmp, "post.json");
    await fs.writeFile(filePath, '{ "author-ref": "ada" }');

    expect(await readRawEntry(schema, filePath)).toEqual({
      "author-ref": "ada",
    });
  });
});
