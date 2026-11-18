import { describe, expect, test } from "vitest";

import { getPackageRoot } from "./get-package-root";

describe("getPackageRoot", () => {
  test.each([
    [
      "/repo/node_modules/.pnpm/micromark@4.0.2/node_modules/micromark/index.js",
      "/repo/node_modules/.pnpm/micromark@4.0.2/node_modules/micromark",
    ],
    [
      "/repo/node_modules/@scope/name/lib/deep/file.js",
      "/repo/node_modules/@scope/name",
    ],
    [
      "/repo/node_modules/outer/node_modules/inner/index.js",
      "/repo/node_modules/outer/node_modules/inner",
    ],
    [
      "C:\\repo\\node_modules\\@scope\\name\\index.js",
      "C:\\repo\\node_modules\\@scope\\name",
    ],
  ])("finds the package of %s", (moduleId, root) => {
    expect(getPackageRoot(moduleId)).toBe(root);
  });

  test.each([
    "/repo/packages/tooling/src/index.ts",
    "\0rolldown/runtime.js",
    "/repo/node_modules/",
    "/repo/node_modules/@scope",
  ])("is undefined outside a package in node_modules: %j", (moduleId) => {
    expect(getPackageRoot(moduleId)).toBeUndefined();
  });
});
