import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { collectTreeSlugs } from "./collect-tree-slugs";

const Schema = z.object({
  title: z.string(),
});

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-collect-tree-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeMd(dir: string, name: string, title: string) {
  await fs.writeFile(
    nodePath.join(dir, `${name}.md`),
    ["---", `title: ${title}`, "---", "", `# ${title}`].join("\n"),
  );
}

function makeTree() {
  const { defineTree } = initQino({ contentFolder: tmp, mediaFolder: tmp });
  return defineTree({
    directory: "/guides",
    schema: Schema,
    extension: ".md",
    titleField: "title",
  });
}

describe("collectTreeSlugs", () => {
  test("collects flat-tree slugs, sorted and unique", async () => {
    const dir = nodePath.join(tmp, "guides");
    await fs.mkdir(dir, { recursive: true });
    await writeMd(dir, "intro", "Intro");
    await writeMd(dir, "advanced", "Advanced");

    expect(await collectTreeSlugs(makeTree())).toEqual(["advanced", "intro"]);
  });

  test("returns an empty array for an empty tree", async () => {
    await fs.mkdir(nodePath.join(tmp, "guides"), { recursive: true });

    expect(await collectTreeSlugs(makeTree())).toEqual([]);
  });
});
