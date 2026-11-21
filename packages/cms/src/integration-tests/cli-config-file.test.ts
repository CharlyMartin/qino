import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { createCloudProject, POST_SCHEMA_PATH } from "./create-cloud-project";
import { runQinoBuild } from "./run-qino-build";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-cli-config-file-"));
  await createCloudProject(tmp);
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function build(ci?: string) {
  return runQinoBuild(tmp, ci);
}

function readConfigFile() {
  return fs.readFile(path.join(tmp, "qino/_generated/config.json"), "utf8");
}

test("build rewrites a stale config.json, except in CI", async () => {
  await expect(build("true")).rejects.toThrow(
    '"qino/_generated/config.json" not found. Run `qino build` and commit it.',
  );

  await build();
  const built = await readConfigFile();

  await fs.writeFile(
    path.join(tmp, POST_SCHEMA_PATH),
    `
      import { z } from "zod";
      export const postSchema = z.object({ title: z.string(), draft: z.boolean().optional() });
    `,
  );

  await expect(build("true")).rejects.toThrow(
    '"qino/_generated/config.json" is out of date. Run `qino build` and commit it.',
  );
  expect(await readConfigFile()).toBe(built);

  await build("false");
  expect(await readConfigFile()).toContain('"draft"');

  const { stdout } = await build("true");
  expect(stdout).toContain("qino/_generated/config.json is up to date.");
}, 60_000);
