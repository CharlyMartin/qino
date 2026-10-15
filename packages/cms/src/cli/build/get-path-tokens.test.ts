import { describe, expect, test } from "vitest";

import { getPathTokens } from "./get-path-tokens";

describe("getPathTokens", () => {
  test("lists tokens in order", () => {
    expect(getPathTokens("posts/{name}-{hash}")).toEqual(["name", "hash"]);
  });

  test("keeps field names with dashes and empty tokens", () => {
    expect(getPathTokens("{created-on}-{}")).toEqual(["created-on", ""]);
  });

  test("is empty without tokens", () => {
    expect(getPathTokens("static")).toEqual([]);
  });
});
