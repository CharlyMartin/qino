import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { MAX_CONCURRENT_FILE_READS } from "../../data/globals";
import { readTextFile } from "./read-text-file";

type ReadFile = typeof fs.readFile;

type ReadResult = Awaited<ReturnType<ReadFile>>;

type ReadStub = () => Promise<ReadResult>;

afterEach(() => {
  vi.restoreAllMocks();
});

function trackReads(read: ReadStub) {
  const counts = { active: 0, max: 0 };
  vi.spyOn(fs, "readFile").mockImplementation((async () => {
    counts.active++;
    counts.max = Math.max(counts.max, counts.active);
    try {
      return await read();
    } finally {
      counts.active--;
    }
  }) as ReadFile);
  return counts;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("readTextFile", () => {
  test("reads a file as UTF-8", async () => {
    const dir = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-read-"));
    const filePath = nodePath.join(dir, "note.md");
    await fs.writeFile(filePath, "Héllo");

    expect(await readTextFile(filePath)).toBe("Héllo");
    await fs.rm(dir, { recursive: true, force: true });
  });

  test(`runs at most ${MAX_CONCURRENT_FILE_READS} reads at once`, async () => {
    const counts = trackReads(async () => {
      await wait(5);
      return "text";
    });
    const total = MAX_CONCURRENT_FILE_READS * 3;

    const texts = await Promise.all(
      Array.from({ length: total }, (_, i) => readTextFile(`/file-${i}.md`)),
    );

    expect(texts).toEqual(Array(total).fill("text"));
    expect(counts.max).toBe(MAX_CONCURRENT_FILE_READS);
  });

  test("frees its place when a read fails", async () => {
    trackReads(async () => {
      await wait(1);
      throw new Error("unreadable");
    });
    const failures = Array.from({ length: MAX_CONCURRENT_FILE_READS }, () =>
      readTextFile("/broken.md").catch((error: Error) => error.message),
    );
    expect(await Promise.all(failures)).toEqual(
      Array(MAX_CONCURRENT_FILE_READS).fill("unreadable"),
    );

    vi.restoreAllMocks();
    trackReads(async () => "text");
    expect(await readTextFile("/next.md")).toBe("text");
  });
});
