import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { writeGeneratedTypes } from "./write-generated-types";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-write-"));
  filePath = nodePath.join(tmp, "_generated", "types.d.ts");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("writeGeneratedTypes", () => {
  test("creates the parent directory and writes when absent", async () => {
    const wrote = await writeGeneratedTypes(filePath, "content");

    expect(wrote).toBe(true);
    expect(await fs.readFile(filePath, "utf-8")).toBe("content");
  });

  test("does not rewrite when content is unchanged (idempotent)", async () => {
    await writeGeneratedTypes(filePath, "content");

    expect(await writeGeneratedTypes(filePath, "content")).toBe(false);
  });

  test("rewrites when the content changed", async () => {
    await writeGeneratedTypes(filePath, "a");

    expect(await writeGeneratedTypes(filePath, "b")).toBe(true);
    expect(await fs.readFile(filePath, "utf-8")).toBe("b");
  });
});
