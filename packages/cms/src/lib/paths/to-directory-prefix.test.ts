import { describe, expect, test } from "vitest";

import { toDirectoryPrefix } from "./to-directory-prefix";

describe("toDirectoryPrefix", () => {
  test("appends a slash to a directory", () => {
    expect(toDirectoryPrefix("posts")).toBe("posts/");
    expect(toDirectoryPrefix("docs/v1")).toBe("docs/v1/");
  });

  test("keeps a single slash on a directory with a trailing slash", () => {
    expect(toDirectoryPrefix("posts/")).toBe("posts/");
  });

  test.each(["", ".", "./"])(
    "returns an empty prefix for the content root %j",
    (directory) => {
      expect(toDirectoryPrefix(directory)).toBe("");
    },
  );
});
