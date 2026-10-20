import { describe, expect, test } from "vitest";

import { getTemplateTokens } from "./get-template-tokens";

describe("getTemplateTokens", () => {
  test("lists tokens in order", () => {
    expect(getTemplateTokens("posts/{name}-{hash}")).toEqual(["name", "hash"]);
  });

  test("keeps field names with dashes and empty tokens", () => {
    expect(getTemplateTokens("{created-on}-{}")).toEqual(["created-on", ""]);
  });

  test("is empty without tokens", () => {
    expect(getTemplateTokens("static")).toEqual([]);
  });
});
