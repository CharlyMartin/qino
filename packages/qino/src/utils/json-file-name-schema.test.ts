import { jsonFileNameSchema } from "qino/utils";
import { describe, expect, test } from "vitest";

describe("jsonFileNameSchema", () => {
  test.each([
    "hello.json",
    "hello.JSON",
    "posts/hello.json",
  ])("accepts %s unchanged", (value) => {
    expect(jsonFileNameSchema.parse(value)).toBe(value);
  });

  test.each([
    "hello.md",
    "hello.markdown",
    "hello.mdx",
    "hello",
    "",
    "hello.json.txt",
    "hello.json/",
  ])("rejects an invalid extension: %s", (value) => {
    const result = jsonFileNameSchema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "File must have a .json extension",
      );
    }
  });

  test.each([
    "/hello.json",
    "/posts/hello.json",
    "//hello.json",
  ])("rejects a leading slash: %s", (value) => {
    const result = jsonFileNameSchema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "File name must not start with a slash",
      );
    }
  });

  test.each([
    null,
    undefined,
    42,
    true,
    {},
    [],
  ])("rejects non-string input: %j", (value) => {
    expect(jsonFileNameSchema.safeParse(value).success).toBe(false);
  });
});
