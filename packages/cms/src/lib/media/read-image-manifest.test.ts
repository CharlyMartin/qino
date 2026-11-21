import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createDependencyCollector } from "../cache/create-dependency-collector";
import { readImageManifest } from "./read-image-manifest";

let tmp: string;
let manifestPath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-read-manifest-"));
  manifestPath = nodePath.join(tmp, "images.json");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const recorded = { size: 120, width: 4, height: 2 };

describe("readImageManifest", () => {
  test("is undefined when there's none", async () => {
    expect(await readImageManifest(manifestPath)).toBeUndefined();
  });

  test("reads it, recording it with its stat", async () => {
    await fs.writeFile(manifestPath, JSON.stringify({ "/a.png": recorded }));
    const dependencies = createDependencyCollector();

    expect(await readImageManifest(manifestPath, dependencies)).toEqual({
      "/a.png": recorded,
    });
    expect([...dependencies.observations.keys()]).toEqual([manifestPath]);
    expect(dependencies.isReusable()).toBe(true);
  });

  test("reads it again once rewritten", async () => {
    await fs.writeFile(manifestPath, JSON.stringify({ "/a.png": recorded }));
    await readImageManifest(manifestPath);
    await fs.writeFile(manifestPath, JSON.stringify({ "/b.png": recorded }));

    expect(await readImageManifest(manifestPath)).toEqual({
      "/b.png": recorded,
    });
  });

  test.each([
    "{ nope",
    "[]",
    "null",
    '{ "/a.png": null }',
    '{ "/a.png": {} }',
    '{ "/a.png": { "size": "120", "width": 4, "height": 2 } }',
    '{ "/a.png": { "size": 120, "width": 4, "height": 2, "blurDataURL": 5 } }',
    '{ "/a.png": { "size": 120, "width": 4, "height": 2, "blurWidth": "8" } }',
  ])("fails on %j, naming the file and qino build", async (data) => {
    await fs.writeFile(manifestPath, data);

    await expect(readImageManifest(manifestPath)).rejects.toThrow(
      `"${manifestPath}" isn't a valid image manifest. Run \`qino build\` to write it again.`,
    );
  });
});
