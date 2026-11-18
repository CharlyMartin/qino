import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyEntry } from "../../test-utils/make-dummy-entry";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { readTargetEntry } from "./read-target-entry";

describe("readTargetEntry", () => {
  test("reads a collection entry by slug", async () => {
    const entry = makeDummyEntry({ slug: "alice", extension: ".json" });
    const target = makeDummyCollection({
      directory: "authors",
      extension: ".json",
      store: new Map([["alice", entry]]),
    });
    const read = vi.spyOn(target[QinoPrimitiveMarker], "readEntry");

    expect(await readTargetEntry(target, "alice")).toBe(entry);
    expect(read).toHaveBeenCalledWith("alice", undefined);
  });

  test("reads a tree entry by slug", async () => {
    const entry = makeDummyEntry({ slug: "guides/setup", extension: ".md" });
    const target = makeDummyTree({
      directory: "docs",
      extension: ".md",
      store: new Map([["guides/setup", entry]]),
    });

    expect(await readTargetEntry(target, "guides/setup")).toBe(entry);
  });

  test("reads an item's only entry, whatever the slug", async () => {
    const target = makeDummyItem({
      file: "config/site.json",
      data: { siteName: "qino" },
    });
    const read = vi.spyOn(target[QinoPrimitiveMarker], "readEntry");

    expect(await readTargetEntry(target, "ignored")).toEqual({
      siteName: "qino",
    });
    expect(read).toHaveBeenCalledWith(undefined);
  });

  test("rejects with the target's own error, unwrapped", async () => {
    const target = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    });

    await expect(readTargetEntry(target, "ghost")).rejects.toThrow(
      "ENOENT: authors/ghost",
    );
  });
});
