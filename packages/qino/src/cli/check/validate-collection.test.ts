import { consola } from "consola";
import { afterEach, describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data";
import { makeDummyCollection, makeDummyEntry } from "../../utils/tests";
import { validateCollection } from "./validate-collection";

describe("validateCollection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("resolves when source reading succeeds", async () => {
    const warn = vi.spyOn(consola, "warn").mockImplementation(() => {});
    const store = new Map([
      ["hello", makeDummyEntry({ slug: "hello", extension: ".md" })],
    ]);
    const collection = makeDummyCollection({
      directory: "/posts",
      extension: ".md",
      store,
    });

    await expect(validateCollection(collection)).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  test("warns when the collection is empty", async () => {
    const warn = vi.spyOn(consola, "warn").mockImplementation(() => {});
    const collection = makeDummyCollection({
      directory: "/posts",
      extension: ".md",
    });

    await validateCollection(collection);

    expect(warn).toHaveBeenCalledWith(`Collection "/posts" is empty.`);
  });

  test("wraps source reading errors with the collection directory", async () => {
    const collection = makeDummyCollection({
      directory: "/posts",
      extension: ".md",
    });
    vi.spyOn(collection[QinoPrimitiveMarker], "readAll").mockRejectedValue(
      new Error("bad frontmatter"),
    );

    await expect(validateCollection(collection)).rejects.toThrow(
      `Collection "/posts" failed validation: bad frontmatter`,
    );
  });
});
