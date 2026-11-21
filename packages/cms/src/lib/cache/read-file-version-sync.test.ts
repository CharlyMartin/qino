import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { readFileVersionSync } from "./read-file-version-sync";

let tmp: string;
let filePath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-version-"));
  filePath = nodePath.join(tmp, "a.md");
  await fs.writeFile(filePath, "first");
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("readFileVersionSync", () => {
  test("versions a file by inode, nanosecond mtime, and size", async () => {
    const stats = await fs.stat(filePath, { bigint: true });

    expect(readFileVersionSync(filePath)).toBe(
      `${stats.ino}:${stats.mtimeNs}:${stats.size}`,
    );
  });

  test("returns a new version once the file changes", async () => {
    const before = readFileVersionSync(filePath);
    await fs.writeFile(filePath, "second!");

    expect(readFileVersionSync(filePath)).not.toBe(before);
  });

  test("returns the absent version for a missing file", () => {
    expect(readFileVersionSync(nodePath.join(tmp, "missing.md"))).toBe(
      "absent",
    );
  });

  test("returns undefined when the stat fails for another reason", () => {
    vi.spyOn(fsSync, "statSync").mockImplementation(() => {
      throw Object.assign(new Error("permission denied"), { code: "EACCES" });
    });

    expect(readFileVersionSync(filePath)).toBeUndefined();
  });
});
