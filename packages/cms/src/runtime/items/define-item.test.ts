import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { initQino } from "../qino/init-qino";

type Home = { title: string };

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
      file: "pages/home.md",
      schema: z.object({ title: z.string() }).strict(),
    });

    await expect(item.getEntry()).resolves.toMatchObject({ words: 2 });
  });
});

describe("item read cache", () => {
  async function writeHome(title: string, seconds: number) {
    const filePath = nodePath.join(tmp, "pages", "home.md");
    await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      ["---", `title: ${title}`, "---", ""].join("\n"),
    );
    await fs.utimes(filePath, seconds, seconds);
  }

  function makeItem(parse = vi.fn((home: Home) => home)) {
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    return qino.defineItem({
      file: "pages/home.md",
      schema: z.object({ title: z.string() }).strict().transform(parse),
    });
  }

  test("reuses the parsed file between reads", async () => {
    await writeHome("Home", 1_000);
    const parse = vi.fn((home: Home) => home);
    const item = makeItem(parse);

    await item.getEntry();
    await item.getEntry();

    expect(parse).toHaveBeenCalledTimes(1);
  });

  test("re-reads the file once it changes", async () => {
    await writeHome("Home", 1_000);
    const item = makeItem();
    expect((await item.getEntry()).title).toBe("Home");

    await writeHome("Welcome", 2_000);

    expect((await item.getEntry()).title).toBe("Welcome");
  });

  test("keeps top-level writes to a returned entry out of later reads", async () => {
    await writeHome("Home", 1_000);
    const item = makeItem();

    const entry = await item.getEntry();
    entry.title = "Changed";

    expect((await item.getEntry()).title).toBe("Home");
  });
});
