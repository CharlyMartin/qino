import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { findTsconfigPath } from "./find-tsconfig-path";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-tsconfig-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("findTsconfigPath", () => {
  test("finds the config in the working directory", async () => {
    const tsconfigPath = path.join(tmp, "tsconfig.json");
    await fs.writeFile(tsconfigPath, "{}");

    expect(await findTsconfigPath(tmp)).toBe(tsconfigPath);
  });

  test("stops at the nearest ancestor config", async () => {
    const cwd = path.join(tmp, "packages/app/src");
    const tsconfigPath = path.join(tmp, "packages/app/tsconfig.json");
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(tmp, "tsconfig.json"), "{}");
    await fs.writeFile(tsconfigPath, "{}");

    expect(await findTsconfigPath(cwd)).toBe(tsconfigPath);
  });

  test("ignores directories named tsconfig.json", async () => {
    const cwd = path.join(tmp, "app");
    const tsconfigPath = path.join(tmp, "tsconfig.json");
    await fs.mkdir(path.join(cwd, "tsconfig.json"), { recursive: true });
    await fs.writeFile(tsconfigPath, "{}");

    expect(await findTsconfigPath(cwd)).toBe(tsconfigPath);
  });

  test("returns undefined when no ancestor has a config", async () => {
    expect(await findTsconfigPath(tmp)).toBeUndefined();
  });
});
