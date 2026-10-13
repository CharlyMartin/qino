import nodePath from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { getGeneratedFilePath } from "./get-generated-file-path";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getGeneratedFilePath", () => {
  test("points to a file in qino/_generated in cwd", () => {
    const cwd = nodePath.resolve("/project");
    vi.spyOn(process, "cwd").mockReturnValue(cwd);

    expect(getGeneratedFilePath("config.json")).toBe(
      nodePath.join(cwd, "qino", "_generated", "config.json"),
    );
  });
});
