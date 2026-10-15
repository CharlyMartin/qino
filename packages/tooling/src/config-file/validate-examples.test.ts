import { existsSync, readdirSync, readFileSync } from "node:fs";
import nodePath from "node:path";

import { expect, test } from "vitest";

import { parseConfigFile } from "./parse-config-file";

const examplesDir = nodePath.resolve(
  import.meta.dirname,
  "../../../../examples",
);
const configFiles = readdirSync(examplesDir)
  .map((name) =>
    nodePath.join(examplesDir, name, "qino/_generated/config.json"),
  )
  .filter((path) => existsSync(path));

test("finds the examples' config files", () => {
  expect(configFiles.length).toBeGreaterThan(0);
});

test.each(configFiles)("parses %s", (path) => {
  const json = JSON.parse(readFileSync(path, "utf8"));
  expect(() => parseConfigFile(json)).not.toThrow();
});
