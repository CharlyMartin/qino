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
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

// Back-to-back writes can share an mtime, so tests set it explicitly.
async function touch(path: string, seconds: number) {
  await fs.utimes(path, seconds, seconds);
}

// Whole seconds, so a later touch restores the exact same mtime.
function recentSeconds() {
  return Math.floor(Date.now() / 1_000);
}

function makeLoader() {
  return vi.fn(async (data: string) => data.toUpperCase());
}

describe("createFileCache", () => {
  test("loads from the file's text once while the file is unchanged", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, 1_000);
    const readFile = vi.spyOn(fs, "readFile");

    expect(await cache.read(filePath, load)).toBe("FIRST");
    expect(await cache.read(filePath, load)).toBe("FIRST");
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("first");
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test("shares one pending load between concurrent reads", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, 1_000);

    await Promise.all([cache.read(filePath, load), cache.read(filePath, load)]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("reloads after the mtime changes", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "other");
    await touch(filePath, 2_000);

    expect(await cache.read(filePath, load)).toBe("OTHER");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("reloads after the size changes, even with the same mtime", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "longer content");
    await touch(filePath, 1_000);

    expect(await cache.read(filePath, load)).toBe("LONGER CONTENT");
  });

  test("reloads after an atomic replace keeps the mtime and size", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, 1_000);
    await cache.read(filePath, load);

    const tempPath = nodePath.join(tmp, "entry.md.tmp");
    await fs.writeFile(tempPath, "third");
    await touch(tempPath, 1_000);
    await fs.rename(tempPath, filePath);

    expect(await cache.read(filePath, load)).toBe("THIRD");
  });

  test("reloads a recent same-size rewrite that keeps every stat", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    const seconds = recentSeconds();
    await touch(filePath, seconds);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "other");
    await touch(filePath, seconds);

    expect(await cache.read(filePath, load)).toBe("OTHER");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("shares one reload between concurrent reads of a same-stat rewrite", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    const seconds = recentSeconds();
    await touch(filePath, seconds);
    await cache.read(filePath, load);

    await fs.writeFile(filePath, "other");
    await touch(filePath, seconds);
    const reads = Array.from({ length: 20 }, () => cache.read(filePath, load));

    expect(new Set(await Promise.all(reads))).toEqual(new Set(["OTHER"]));
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("compares a recent file's text instead of reloading it when unchanged", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    await touch(filePath, recentSeconds());
    const readFile = vi.spyOn(fs, "readFile");

    await cache.read(filePath, load);
    expect(await cache.read(filePath, load)).toBe("FIRST");
    expect(load).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  test("trusts a recent file's stats again once its mtime is old enough", async () => {
    const cache = createFileCache();
    const load = makeLoader();
    const seconds = recentSeconds();
    await touch(filePath, seconds);
    await cache.read(filePath, load);
    const readFile = vi.spyOn(fs, "readFile");

    vi.spyOn(Date, "now").mockReturnValue(seconds * 1_000 + 5_000);
    await cache.read(filePath, load);
    await cache.read(filePath, load);

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("drops a rejected load so the next read retries", async () => {
    const cache = createFileCache();
    const failure = new Error("Parse failed");
    const load = vi
      .fn<(data: string) => Promise<string>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("recovered");

    await expect(cache.read(filePath, load)).rejects.toBe(failure);
    expect(await cache.read(filePath, load)).toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("throws readFile's error for a missing file without caching", async () => {
    const cache = createFileCache();
    const missing = nodePath.join(tmp, "missing.md");
    const load = makeLoader();

    await expect(cache.read(missing, load)).rejects.toThrow(
      /ENOENT: no such file or directory, open/,
    );
    await expect(cache.read(missing, load)).rejects.toThrow(/ENOENT/);
    expect(load).not.toHaveBeenCalled();
  });

  describe("dropping removed files", () => {
    // Moving a file away and back keeps its inode, mtime, and size, so only a
    // dropped slot makes the next read load it again.
    async function moveAwayAndBack(between: () => Promise<unknown>) {
      const awayPath = nodePath.join(tmp, "away.md");
      await fs.rename(filePath, awayPath);
      await between();
      await fs.rename(awayPath, filePath);
    }

    test("keeps the slot when nothing drops it", async () => {
      const cache = createFileCache();
      const load = makeLoader();
      await touch(filePath, 1_000);
      await cache.read(filePath, load);

      await moveAwayAndBack(async () => {});

      await cache.read(filePath, load);
      expect(load).toHaveBeenCalledTimes(1);
    });

    test("drops the slot of a file a read finds missing", async () => {
      const cache = createFileCache();
      const load = makeLoader();
      await touch(filePath, 1_000);
      await cache.read(filePath, load);

      await moveAwayAndBack(() =>
        expect(cache.read(filePath, load)).rejects.toThrow(/ENOENT/),
      );

      await cache.read(filePath, load);
      expect(load).toHaveBeenCalledTimes(2);
    });

    test("retain drops the slots of paths it isn't given", async () => {
      const cache = createFileCache();
      const load = makeLoader();
      const otherPath = nodePath.join(tmp, "other.md");
      await fs.writeFile(otherPath, "other");
      await touch(filePath, 1_000);
      await touch(otherPath, 1_000);
      await cache.read(filePath, load);
      await cache.read(otherPath, load);

      await moveAwayAndBack(async () => cache.retain([otherPath]));

      await cache.read(filePath, load);
      await cache.read(otherPath, load);
      expect(load).toHaveBeenCalledTimes(3);
      expect(load).toHaveBeenLastCalledWith("first");
    });
  });

  test("keeps separate caches apart", async () => {
    const load = makeLoader();
    await touch(filePath, 1_000);

    await createFileCache().read(filePath, load);
    await createFileCache().read(filePath, load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
