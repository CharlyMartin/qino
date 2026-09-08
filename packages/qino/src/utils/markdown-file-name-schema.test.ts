import { describe, expect, test } from "vitest";

import { markdownFileNameSchema } from "qino/utils";

describe("markdownFileNameSchema", () => {
  test.each([
    "hello.md",
    "hello.MD",
    "posts/hello.md",
    "hello.markdown",
    "hello.MARKDOWN",
    "posts/hello.markdown",
  ])("accepts %s unchanged", (value) => {
    expect(markdownFileNameSchema.parse(value)).toBe(value);
  });

  test.each([
    "hello.mdx",
    "hello.json",
    "hello",
    "",
    "hello.md.txt",
    "hello.md/",
  ])("rejects an invalid extension: %s", (value) => {
    const result = markdownFileNameSchema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "File must have a .md or .markdown extension",
      );
    }
  });

  test.each([
    "/hello.md",
    "/posts/hello.md",
    "//hello.md",
    "/hello.markdown",
    "/posts/hello.markdown",
    "//hello.markdown",
  ])("rejects a leading slash: %s", (value) => {
    const result = markdownFileNameSchema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "File name must not start with a slash",
      );
    }
  });

  test.each([null, undefined, 42, true, {}, []])(
    "rejects non-string input: %j",
    (value) => {
      expect(markdownFileNameSchema.safeParse(value).success).toBe(false);
    },
  );
});
