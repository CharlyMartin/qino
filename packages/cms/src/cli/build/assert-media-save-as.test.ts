import { describe, expect, test } from "vitest";

import { assertMediaSaveAs } from "./assert-media-save-as";

describe("assertMediaSaveAs", () => {
  test.each([
    "{id}/{name}-{hash}.{ext}",
    "uploads/{name}.{ext}",
    "{hash}.{ext}",
  ])("accepts %s", (path) => {
    expect(() => assertMediaSaveAs(path, "posts")).not.toThrow();
  });

  test("rejects unknown tokens", () => {
    expect(() => assertMediaSaveAs("{id}/{slug}.{ext}", "posts")).toThrow(
      'media.saveAs "{id}/{slug}.{ext}" of "posts" has an unknown token "{slug}". Use {id}, {name}, {hash}, {ext}.',
    );
  });

  test("requires a trailing .{ext}", () => {
    expect(() => assertMediaSaveAs("{id}/{name}.webp", "posts")).toThrow(
      'must end with ".{ext}"',
    );
  });

  test.each(["/{id}/{name}.{ext}", "../{name}.{ext}", "{id}/../{name}.{ext}"])(
    "rejects %s, which escapes mediaFolder",
    (path) => {
      expect(() => assertMediaSaveAs(path, "posts")).toThrow(
        "must be relative to mediaFolder",
      );
    },
  );
});
