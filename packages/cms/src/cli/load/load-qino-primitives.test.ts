import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { createJiti } from "jiti";
import { afterEach, beforeEach, expect, test } from "vitest";

import { loadQinoPrimitives } from "./load-qino-primitives";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-load-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const jiti = createJiti(import.meta.url, { moduleCache: false });

test.each([
  "posts.test.ts",
  "posts.spec.ts",
  "types.test-d.ts",
  "nested/posts.test.tsx",
  "posts.test.mjs",
])("skips the test file %s", async (file) => {
  await fs.mkdir(nodePath.dirname(nodePath.join(tmp, file)), {
    recursive: true,
  });
  await fs.writeFile(
    nodePath.join(tmp, file),
    'throw new Error("A test file was loaded.");\n',
  );

  await expect(loadQinoPrimitives(tmp, jiti)).resolves.toEqual({
    collections: [],
    items: [],
    trees: [],
  });
});

test("loads the other files", async () => {
  await fs.writeFile(
    nodePath.join(tmp, "posts.ts"),
    'throw new Error("posts.ts was loaded.");\n',
  );

  await expect(loadQinoPrimitives(tmp, jiti)).rejects.toThrow(
    "posts.ts was loaded.",
  );
});
