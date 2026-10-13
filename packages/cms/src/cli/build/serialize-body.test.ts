import { describe, expect, test } from "vitest";

import { serializeBody } from "./serialize-body";

describe("serializeBody", () => {
  test("describes Markdown bodies", () => {
    expect(serializeBody(".md")).toEqual({ format: "markdown" });
    expect(serializeBody(".markdown")).toEqual({ format: "markdown" });
  });

  test("describes MDX bodies", () => {
    expect(serializeBody(".mdx")).toEqual({ format: "mdx" });
  });

  test("returns null for JSON entries", () => {
    expect(serializeBody(".json")).toBeNull();
  });
});
