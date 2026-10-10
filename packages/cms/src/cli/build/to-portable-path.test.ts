import nodePath from "node:path";

import { describe, expect, test } from "vitest";

import { toPortablePath } from "./to-portable-path";

const cwd = nodePath.resolve("/project/apps/site");

describe("toPortablePath", () => {
  test("keeps relative paths", () => {
    expect(toPortablePath("src/content", cwd)).toBe("src/content");
    expect(toPortablePath("../../content", cwd)).toBe("../../content");
  });

  test("normalizes redundant segments", () => {
    expect(toPortablePath("./src//content/", cwd)).toBe("src/content");
  });

  test("makes absolute paths relative to cwd", () => {
    expect(toPortablePath(nodePath.join(cwd, "public"), cwd)).toBe("public");
  });

  test("returns . for cwd itself", () => {
    expect(toPortablePath(cwd, cwd)).toBe(".");
  });
});
