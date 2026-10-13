import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { assertMediaExists } from "./assert-media-exists";

let tmp: string;
let contentFolder: string;
let folder: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-media-"));
  contentFolder = nodePath.join(tmp, "content");
  folder = nodePath.join(tmp, "public");
  await fs.mkdir(contentFolder);
  await fs.mkdir(folder);
  await fs.writeFile(nodePath.join(folder, "a.png"), "");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("assertMediaExists", () => {
  test("resolves when every reference exists", async () => {
    await fs.writeFile(nodePath.join(contentFolder, "a.md"), "![](/a.png)");

    await expect(
      assertMediaExists({
        contentFolder,
        mediaFolder: folder,
      }),
    ).resolves.toBeUndefined();
  });

  test("throws listing every missing reference", async () => {
    const file = nodePath.join(contentFolder, "a.md");
    await fs.writeFile(file, '![](/b.png)\n<video src="/c.mp4" />');
    const relative = nodePath.relative(process.cwd(), file);

    await expect(
      assertMediaExists({
        contentFolder,
        mediaFolder: folder,
      }),
    ).rejects.toThrow(
      `2 missing media files in "${folder}":\n  - ${relative}:1 → /b.png\n  - ${relative}:2 → /c.mp4`,
    );
  });
});
