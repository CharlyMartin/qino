import { consola } from "consola";
import { afterEach, describe, expect, test, vi } from "vitest";

import { makeDummyCollection, makeDummyEntry } from "../../utils/tests";
import { validateCollection } from "./validate-collection";

describe("validateCollection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("resolves when getAll succeeds", async () => {
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

  test("wraps getAll errors with the collection directory", async () => {
    const collection = makeDummyCollection({
      directory: "/posts",
      extension: ".md",
    });
    collection.getAll = (async () => {
      throw new Error("bad frontmatter");
    }) as typeof collection.getAll;

    await expect(validateCollection(collection)).rejects.toThrow(
      `Collection "/posts" failed validation: bad frontmatter`,
    );
  });
});
