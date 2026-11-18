import fs from "node:fs";
import path from "node:path";

import { Rolldown } from "tsdown";
import { describe, expect, test } from "vitest";

import { getRolldownRoot } from "./get-rolldown-root";

describe("getRolldownRoot", () => {
  // unrun installs another Rolldown, so the name alone doesn't tell them apart.
  test("finds the Rolldown package that tsdown builds with", () => {
    const root = getRolldownRoot();

    expect(root).toBeDefined();
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root ?? "", "package.json"), "utf8"),
    );
    expect(packageJson).toMatchObject({
      name: "rolldown",
      version: Rolldown.VERSION,
      license: "MIT",
    });
  });
});
