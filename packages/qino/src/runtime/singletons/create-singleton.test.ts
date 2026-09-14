import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { createQino } from "../qino/create-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-singleton-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("createSingleton", () => {
  test("adds derived fields from an async augment callback", async () => {
    const pages = nodePath.join(tmp, "pages");
    await fs.mkdir(pages);
    await fs.writeFile(
      nodePath.join(pages, "home.md"),
      ["---", "title: Home", "---", "", "One two"].join("\n"),
    );

    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const singleton = qino.createSingleton({
      views: (view) => ({
        default: view({
          augment: async ({ body }) => ({
            words: body.trim().split(/\s+/u).length,
          }),
        }),
      }),
      file: "/pages/home.md",
      schema: z
        .object({ title: z.string(), [MARKDOWN_BODY_FIELD_NAME]: z.string() })
        .strict(),
    });

    await expect(singleton.getData()).resolves.toMatchObject({ words: 2 });
  });
});
