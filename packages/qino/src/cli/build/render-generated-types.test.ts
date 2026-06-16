import { describe, expect, test } from "vitest";

import {
  BANNER,
  EMPTY,
  EMPTY_EXPORT,
  NEW_LINE,
  renderGeneratedTypes,
} from "./render-generated-types";

describe("renderGeneratedTypes", () => {
  test("renders an alias and registry entry per primitive (assistive union)", () => {
    const output = renderGeneratedTypes([
      {
        directory: "/posts",
        typeName: "PostSlug",
        slugs: ["hello-world", "second-post"],
      },
    ]);

    expect(output).toBe(
      [
        BANNER,
        EMPTY,
        EMPTY_EXPORT,
        "",
        'declare module "qino" {',
        '  export type PostSlug = "hello-world" | "second-post" | (string & {});',
        "",
        "  interface QinoSlugRegistry {",
        '    "/posts": PostSlug;',
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });

  test("emits a no-op module for an empty registry", () => {
    expect(renderGeneratedTypes([])).toBe(
      [BANNER, EMPTY_EXPORT].join(NEW_LINE),
    );
  });
});
