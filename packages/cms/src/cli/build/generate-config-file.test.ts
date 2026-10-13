import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { QinoConfigMarker } from "../../data/globals";
import { initQino } from "../../runtime/qino/init-qino";
import { createConfigFile } from "./create-config-file";
import { generateConfigFile } from "./generate-config-file";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-config-file-"));
  filePath = nodePath.join(tmp, "qino", "_generated", "config.json");
  vi.spyOn(process, "cwd").mockReturnValue(tmp);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup() {
  const qino = initQino({ contentFolder: "content", mediaFolder: "public" });

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

describe("generateConfigFile", () => {
  test("writes qino/_generated/config.json", async () => {
    expect(await generateConfigFile(setup())).toBe(true);
    expect(await fs.readFile(filePath, "utf-8")).toBe(
      createConfigFile(setup()),
    );
  });

  test("does not rewrite on unchanged inputs (idempotent)", async () => {
    await generateConfigFile(setup());

    expect(await generateConfigFile(setup())).toBe(false);
  });
});
