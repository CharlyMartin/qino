import { describe, expect, test } from "vitest";

import type { AnyMediaConfig } from "../../types/media";
import { assertMediaConfig } from "./assert-media-config";

const image = { accepted: "image/png", maxSize: "1MB" } as const;
const markdown = [{ accepted: "image/png", maxSize: "1MB" }] as const;

function assert(
  media: AnyMediaConfig,
  extension = ".md",
  relations: object = {},
) {
  assertMediaConfig({ media, relations, extension, primitiveId: "posts" });
}

describe("assertMediaConfig", () => {
  test("accepts field paths and markdown", () => {
    expect(() =>
      assert({
        cover: image,
        "gallery[*]": image,
        "seo.image": image,
        markdown,
      }),
    ).not.toThrow();
  });

  test("rejects a malformed path", () => {
    expect(() => assert({ "gallery..image": image })).toThrow(
      'media "gallery..image" of "posts" isn\'t a valid path',
    );
  });

  test("rejects a path that is also a relation", () => {
    expect(() => assert({ author: image }, ".md", { author: {} })).toThrow(
      'media "author" of "posts" is also a relation.',
    );
  });

  test("rejects markdown on JSON files", () => {
    expect(() => assert({ markdown }, ".json")).toThrow(
      'media "markdown" of "posts" checks the Markdown body, but JSON files have none.',
    );
  });
});
