import { describe, expect, test } from "vitest";

import { assertContentPath } from "./assert-content-path";

describe("assertContentPath", () => {
  test("accepts a relative path", () => {
    expect(() => assertContentPath("posts", "directory")).not.toThrow();
  });

  test("accepts a nested relative path", () => {
    expect(() => assertContentPath("pages/home.md", "file")).not.toThrow();
  });

  test("throws with a fix-it hint on a leading slash", () => {
    expect(() => assertContentPath("/posts", "directory")).toThrow(
      'directory "/posts" must be relative to contentFolder, without a leading "/". Use "posts".',
    );
  });
});
