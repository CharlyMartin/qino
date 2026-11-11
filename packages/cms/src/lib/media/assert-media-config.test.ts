import { describe, expect, test } from "vitest";

import type { AnyMediaConfig } from "../../types/media";
import { assertMediaConfig } from "./assert-media-config";

const image = { accepted: "image/png", maxSize: "1MB" } as const;

function assert(media: AnyMediaConfig, relations: object = {}) {
  assertMediaConfig({ media, relations, primitiveId: "posts" });
}

describe("assertMediaConfig", () => {
  test("accepts field paths", () => {
    expect(() =>
      assert({ cover: image, "gallery[*]": image, "seo.image": image }),
    ).not.toThrow();
  });

  test("rejects a malformed path", () => {
    expect(() => assert({ "gallery..image": image })).toThrow(
      'media "gallery..image" of "posts" isn\'t a valid path',
    );
  });

  test("rejects a path that is also a relation", () => {
    expect(() => assert({ author: image }, { author: {} })).toThrow(
      'media "author" of "posts" is also a relation.',
    );
  });

  test("points markdown to markdown.media", () => {
    expect(() =>
      assert({ markdown: [image] as unknown as AnyMediaConfig[string] }),
    ).toThrow(
      'media "markdown" of "posts" is the Markdown body: set its rules in markdown.media.',
    );
  });
});
