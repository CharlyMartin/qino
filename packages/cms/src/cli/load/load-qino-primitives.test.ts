import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { createJiti } from "jiti";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { loadQinoPrimitives } from "./load-qino-primitives";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-load-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const jiti = createJiti(import.meta.url);

async function writeFile(file: string, content: string) {
  const filePath = nodePath.join(tmp, file);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

describe("loadQinoPrimitives", () => {
  test.each([
    "posts.test.ts",
    "posts.spec.ts",
    "types.test-d.ts",
    "nested/posts.test.tsx",
    "posts.test.mjs",
  ])("skips the test file %s", async (file) => {
    await writeFile(file, 'throw new Error("A test file was loaded.");\n');

    await expect(loadQinoPrimitives(tmp, jiti)).resolves.toEqual({
      collections: [],
      items: [],
      trees: [],
    });
  });

  test.each(["posts.ts", "latest.ts", "v1.test.fixtures/posts.ts"])(
    "loads %s, which isn't a test file",
    async (file) => {
      await writeFile(file, `throw new Error("${file} was loaded.");\n`);

      await expect(loadQinoPrimitives(tmp, jiti)).rejects.toThrow(
        `${file} was loaded.`,
      );
    },
  );
});
