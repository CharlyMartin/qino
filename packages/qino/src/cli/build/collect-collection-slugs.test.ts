import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { createQino } from "../../runtime/qino/create-qino";
import { collectCollectionSlugs } from "./collect-collection-slugs";

const Schema = z.object({
  title: z.string(),
  [MARKDOWN_BODY_FIELD_NAME]: z.string(),
});

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-collect-collection-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
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
    schema: Schema,
    extension: ".md",
  });
}

describe("collectCollectionSlugs", () => {
  test("returns each entry's slug, sorted", async () => {
    await writeMd("second.md", "Second");
    await writeMd("first.md", "First");

    expect(await collectCollectionSlugs(makeCollection())).toEqual([
      "first",
      "second",
    ]);
  });

  test("ignores files in subdirectories (collections are flat)", async () => {
    await writeMd("first.md", "First");
    await writeMd("guides/intro.md", "Intro");

    expect(await collectCollectionSlugs(makeCollection())).toEqual(["first"]);
  });

  test("returns an empty array for an empty collection", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"), { recursive: true });

    expect(await collectCollectionSlugs(makeCollection())).toEqual([]);
  });
});
