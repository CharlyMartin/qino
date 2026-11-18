import type { BigIntStats } from "node:fs";

import { describe, expect, test } from "vitest";

import { observeFile } from "./observe-file";

function makeStats(mtimeMs: number) {
  return {
    ino: 7n,
    size: 42n,
    mtimeMs: BigInt(mtimeMs),
    mtimeNs: BigInt(mtimeMs) * 1_000_000n + 5n,
  } as BigIntStats;
}

describe("observeFile", () => {
  test("versions a file by inode, nanosecond mtime, and size", () => {
    expect(observeFile(makeStats(1_000), 10_000).version).toBe(
      "7:1000000005:42",
    );
  });

  test("distrusts a file edited within 2s of the stat", () => {
    expect(observeFile(makeStats(9_000), 10_000).untrusted).toBe(true);
    expect(observeFile(makeStats(8_001), 10_000).untrusted).toBe(true);
    expect(observeFile(makeStats(8_000), 10_000).untrusted).toBe(false);
  });

  test("distrusts a file whose mtime is ahead of the clock", () => {
    expect(observeFile(makeStats(20_000), 10_000).untrusted).toBe(true);
  });
});
