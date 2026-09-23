import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../qino/init-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-item-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("defineItem", () => {
  test("adds derived fields from an async augment callback", async () => {
    const pages = nodePath.join(tmp, "pages");
    await fs.mkdir(pages);
    await fs.writeFile(
      nodePath.join(pages, "home.md"),
      ["---", "title: Home", "---", "", "One two"].join("\n"),
    );

    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const item = qino.defineItem({
      views: (view) => ({
        default: view({
          augment: async ({ markdown }) => ({
            words: markdown.trim().split(/\s+/u).length,
          }),
        }),
      }),
      file: "/pages/home.md",
      schema: z.object({ markdown: z.string(), title: z.string() }).strict(),
    });

    await expect(item.getData()).resolves.toMatchObject({ words: 2 });
  });
});
