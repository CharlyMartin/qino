import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { hasUnchangedFiles } from "./has-unchanged-files";
import { observeFile } from "./observe-file";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-unchanged-"));
  filePath = nodePath.join(tmp, "a.md");
  await fs.writeFile(filePath, "first");
  await fs.utimes(filePath, 1_000, 1_000);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

async function observe(path: string) {
  return observeFile(await fs.stat(path, { bigint: true }), Date.now());
}

describe("hasUnchangedFiles", () => {
  test("is true while every file keeps its observed version", async () => {
    const dependencies = new Map([[filePath, await observe(filePath)]]);

    expect(hasUnchangedFiles(dependencies, new Map())).toBe(true);
  });

  test("is false once a file's version changes", async () => {
    const dependencies = new Map([[filePath, await observe(filePath)]]);
    await fs.writeFile(filePath, "second!");
    await fs.utimes(filePath, 1_000, 1_000);

    expect(hasUnchangedFiles(dependencies, new Map())).toBe(false);
  });

  test("is false for a file observed within 2s of an edit, even unchanged", async () => {
    const observation = { ...(await observe(filePath)), untrusted: true };

    expect(
      hasUnchangedFiles(new Map([[filePath, observation]]), new Map()),
    ).toBe(false);
  });

  test("is false once a file is gone, or can't be stat'd", async () => {
    const dependencies = new Map([[filePath, await observe(filePath)]]);
    const statSync = vi.spyOn(fsSync, "statSync").mockImplementationOnce(() => {
      throw Object.assign(new Error("EACCES"), { code: "EACCES" });
    });

    expect(hasUnchangedFiles(dependencies, new Map())).toBe(false);
    statSync.mockRestore();
    await fs.rm(filePath);
    expect(hasUnchangedFiles(dependencies, new Map())).toBe(false);
  });

  test("stats each file once across the entries that share a call's versions", async () => {
    const dependencies = new Map([[filePath, await observe(filePath)]]);
    const versions = new Map<string, string | undefined>();
    const statSync = vi.spyOn(fsSync, "statSync");

    expect(hasUnchangedFiles(dependencies, versions)).toBe(true);
    expect(hasUnchangedFiles(dependencies, versions)).toBe(true);
    expect(statSync).toHaveBeenCalledTimes(1);
  });
});
