import { describe, expect, test } from "vitest";

import { assertSaveFileAs } from "./assert-save-file-as";

describe("assertSaveFileAs", () => {
  test.each([
    "{id}/{name}-{hash}",
    "{id}/{field}/{name}",
    "{hash}",
    "v1.0/{name}",
  ])("accepts %s", (path) => {
    expect(() => assertSaveFileAs(path, "posts")).not.toThrow();
  });

  test("rejects unknown tokens", () => {
    expect(() => assertSaveFileAs("{id}/{slug}", "posts")).toThrow(
      'cloud.media.saveFileAs "{id}/{slug}" of "posts" has an unknown token "{slug}". Use {id}, {field}, {name}, {hash}.',
    );
  });

  test.each(["{id}/{name}.{ext}", "{id}/{name}.webp"])(
    "rejects %s, which sets the extension",
    (path) => {
      expect(() => assertSaveFileAs(path, "posts")).toThrow(
        `cloud.media.saveFileAs "${path}" of "posts" can't contain "." in its file name: the cloud UI adds the extension.`,
      );
    },
  );

  test("requires a file name", () => {
    expect(() => assertSaveFileAs("{id}/", "posts")).toThrow(
      "must end with a file name",
    );
  });

  test.each(["/{id}/{name}", "../{name}", "{id}/../{name}"])(
    "rejects %s, which escapes mediaFolder",
    (path) => {
      expect(() => assertSaveFileAs(path, "posts")).toThrow(
        "must be relative to mediaFolder",
      );
    },
  );
});
