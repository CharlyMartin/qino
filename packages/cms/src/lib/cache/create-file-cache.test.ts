import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createFileCache } from "./create-file-cache";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-file-cache-"));
  filePath = nodePath.join(tmp, "entry.md");
  await fs.writeFile(filePath, "first");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

// Back-to-back writes can share an mtime, so tests move it explicitly.
async function touch(path: string, seconds: number) {
  await fs.utimes(path, seconds, seconds);
}

describe("createFileCache", () => {
  test("loads once while the file is unchanged", async () => {
    const cache = createFileCache();
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));

    expect(await cache.read(filePath, load)).toBe("first");
    expect(await cache.read(filePath, load)).toBe("first");
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("shares one pending load between concurrent reads", async () => {
    const cache = createFileCache();
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));

    await Promise.all([cache.read(filePath, load), cache.read(filePath, load)]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("reloads after the mtime changes", async () => {
    const cache = createFileCache();
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "other");
    await touch(filePath, 2_000);

    expect(await cache.read(filePath, load)).toBe("other");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("reloads after the size changes, even with the same mtime", async () => {
    const cache = createFileCache();
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "longer content");
    await touch(filePath, 1_000);

    expect(await cache.read(filePath, load)).toBe("longer content");
  });

  test("reloads after an atomic replace keeps the mtime and size", async () => {
    const cache = createFileCache();
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    const tempPath = nodePath.join(tmp, "entry.md.tmp");
    await fs.writeFile(tempPath, "third");
    await touch(tempPath, 1_000);
    await fs.rename(tempPath, filePath);

    expect(await cache.read(filePath, load)).toBe("third");
  });

  test("drops a rejected load so the next read retries", async () => {
    const cache = createFileCache();
    const failure = new Error("Parse failed");
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("recovered");

    await expect(cache.read(filePath, load)).rejects.toBe(failure);
    expect(await cache.read(filePath, load)).toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("leaves a missing file to the loader without caching", async () => {
    const cache = createFileCache();
    const missing = nodePath.join(tmp, "missing.md");
    const load = vi.fn(() => fs.readFile(missing, "utf-8"));

    await expect(cache.read(missing, load)).rejects.toThrow(/ENOENT/);
    await expect(cache.read(missing, load)).rejects.toThrow(/ENOENT/);
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("keeps separate caches apart", async () => {
    const load = vi.fn(() => fs.readFile(filePath, "utf-8"));

    await createFileCache().read(filePath, load);
    await createFileCache().read(filePath, load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
