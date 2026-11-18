import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createLicensesPlugin } from "./create-licenses-plugin";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-licenses-plugin-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function generateBundle(bundle: Record<string, unknown>) {
  const emitFile = vi.fn();
  createLicensesPlugin().generateBundle.call(
    { emitFile } as never,
    {} as never,
    bundle as never,
  );
  expect(emitFile).toHaveBeenCalledTimes(1);
  return emitFile.mock.lastCall?.[0];
}

describe("createLicensesPlugin", () => {
  test("emits the licenses of every chunk's packages as one asset", async () => {
    const root = path.join(tmp, "node_modules", "micromark");
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "micromark", version: "4.0.2", license: "MIT" }),
    );
    await fs.writeFile(path.join(root, "license"), "Copyright (c) Titus");

    const asset = generateBundle({
      "index.mjs": { type: "chunk", moduleIds: [path.join(tmp, "src/a.ts")] },
      "parser.mjs": { type: "chunk", moduleIds: [path.join(root, "x.js")] },
      "styles.css": { type: "asset" },
    });

    expect(asset).toEqual({
      type: "asset",
      fileName: "THIRD-PARTY-LICENSES.md",
      source: expect.stringContaining(
        "## micromark@4.0.2\n\nLicense: MIT\n\n```text\nCopyright (c) Titus\n```",
      ),
    });
    expect(asset.source).not.toContain("rolldown@");
  });

  test("credits Rolldown when its runtime helpers are in a chunk", () => {
    const asset = generateBundle({
      "index.mjs": {
        type: "chunk",
        moduleIds: ["\0rolldown/runtime.js", "\0other-virtual-module"],
      },
    });

    expect(asset.source).toMatch(/## rolldown@\S+\n\nLicense: MIT\n\n```text/);
  });
});
