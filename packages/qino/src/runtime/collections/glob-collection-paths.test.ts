import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { globCollectionPaths } from "./glob-collection-paths";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-glob-collection-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(relPath: string) {
  const filePath = nodePath.join(tmp, relPath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, "");
}

describe("globCollectionPaths", () => {
  test("returns only first-level files (ignores nested directories)", async () => {
    await write("first.md");
    await write("second.md");
    await write("guides/intro.md");
    await write("guides/nested/deep.md");

    const paths = await globCollectionPaths({
      absoluteDirPath: tmp,
      extension: ".md",
    });

    expect(paths.sort()).toEqual(["first.md", "second.md"]);
  });

  test("ignores files with a different extension", async () => {
    await write("post.md");
    await write("data.json");

    const paths = await globCollectionPaths({
      absoluteDirPath: tmp,
      extension: ".md",
    });

    expect(paths).toEqual(["post.md"]);
  });

  test("returns an empty array when no first-level files match", async () => {
    await write("guides/intro.md");

    const paths = await globCollectionPaths({
      absoluteDirPath: tmp,
      extension: ".md",
    });

    expect(paths).toEqual([]);
  });
});
