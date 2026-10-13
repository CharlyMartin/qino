import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { QinoConfigMarker } from "../../data/globals";
import { initQino } from "../../runtime/qino/init-qino";
import { createConfigFile } from "../build/create-config-file";
import { assertConfigFileFresh } from "./assert-config-file-fresh";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-config-fresh-"));
  filePath = nodePath.join(tmp, "qino", "_generated", "config.json");
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(tmp);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup() {
  const qino = initQino({
    contentFolder: "content",
    mediaFolder: "public",
    buildConfigFile: true,
  });

  return {
    context: qino[QinoConfigMarker],
    collections: [
      qino.defineCollection({
        directory: "posts",
        schema: z.object({ title: z.string() }),
        extension: ".md",
      }),
    ],
  };
}

describe("assertConfigFileFresh", () => {
  test("passes when the file matches", async () => {
    await fs.writeFile(filePath, createConfigFile(setup()));

    await expect(assertConfigFileFresh(setup())).resolves.toBeUndefined();
  });

  test("throws when the file is missing", async () => {
    await expect(assertConfigFileFresh(setup())).rejects.toThrow(
      '"qino/_generated/config.json" not found. Run `qino build` and commit it.',
    );
  });

  test("throws when the file is out of date", async () => {
    await fs.writeFile(filePath, "{}\n");

    await expect(assertConfigFileFresh(setup())).rejects.toThrow(
      '"qino/_generated/config.json" is out of date. Run `qino build` and commit it.',
    );
  });
});
