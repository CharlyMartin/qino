import { describe, expect, test } from "vitest";

import { mdxFileNameSchema } from "qino/utils";

describe("mdxFileNameSchema", () => {
  test.each(["hello.mdx", "hello.MDX", "posts/hello.mdx"])(
    "accepts %s unchanged",
    (value) => {
      expect(mdxFileNameSchema.parse(value)).toBe(value);
    },
  );

  test.each([
    "hello.md",
    "hello.markdown",
    "hello.json",
    "hello",
    "",
    "hello.mdx.txt",
    "hello.mdx/",
  ])("rejects an invalid extension: %s", (value) => {
    const result = mdxFileNameSchema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "File must have a .mdx extension",
      );
    }
  });

  test.each(["/hello.mdx", "/posts/hello.mdx", "//hello.mdx"])(
    "rejects a leading slash: %s",
    (value) => {
      const result = mdxFileNameSchema.safeParse(value);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "File name must not start with a slash",
        );
      }
    },
  );

  test.each([null, undefined, 42, true, {}, []])(
    "rejects non-string input: %j",
    (value) => {
      expect(mdxFileNameSchema.safeParse(value).success).toBe(false);
    },
  );
});
