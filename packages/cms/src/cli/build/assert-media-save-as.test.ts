import { describe, expect, test } from "vitest";

import { assertMediaSaveAs } from "./assert-media-save-as";

describe("assertMediaSaveAs", () => {
  test.each(["{id}/{name}-{hash}", "uploads/{name}", "{hash}", "v1.0/{name}"])(
    "accepts %s",
    (path) => {
      expect(() => assertMediaSaveAs(path, "posts")).not.toThrow();
    },
  );

  test("rejects unknown tokens", () => {
    expect(() => assertMediaSaveAs("{id}/{slug}", "posts")).toThrow(
      'media.saveAs "{id}/{slug}" of "posts" has an unknown token "{slug}". Use {id}, {name}, {hash}.',
    );
  });

  test.each(["{id}/{name}.{ext}", "{id}/{name}.webp"])(
    "rejects %s, which sets the extension",
    (path) => {
      expect(() => assertMediaSaveAs(path, "posts")).toThrow(
        `media.saveAs "${path}" of "posts" can't contain "." in its file name: the cloud UI adds the extension.`,
      );
    },
  );

  test("requires a file name", () => {
    expect(() => assertMediaSaveAs("{id}/", "posts")).toThrow(
      "must end with a file name",
    );
  });

  test.each(["/{id}/{name}", "../{name}", "{id}/../{name}"])(
    "rejects %s, which escapes mediaFolder",
    (path) => {
      expect(() => assertMediaSaveAs(path, "posts")).toThrow(
        "must be relative to mediaFolder",
      );
    },
  );
});
