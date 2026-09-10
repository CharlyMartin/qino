import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import {
  makeDummyCollection,
  makeDummyEntry,
  makeDummySingleton,
  makeDummyTree,
} from "../../utils/tests";
import { fetchTargetEntry } from "./fetch-target-entry";

const ctx = { sourceFilePath: "/fixtures/post.json", relationKey: "author" };

describe("fetchTargetEntry", () => {
  describe("collection target", () => {
    test("delegates to the source reader and returns the entry", async () => {
      const entry = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice" },
      });
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", entry]]),
      });
      const spy = vi.spyOn(target[QinoPrimitiveMarker], "readOne");

      const result = await fetchTargetEntry(target, "alice", ctx);

      expect(result).toBe(entry);
      expect(spy).toHaveBeenCalledWith("alice");
    });

    test("wraps a source read error with the collection directory and slug", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });

      await expect(fetchTargetEntry(target, "ghost", ctx)).rejects.toThrow(
        /author.*\/authors\/ghost.*post\.json.*ENOENT/,
      );
    });

    test("preserves the original Error as cause", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });
      const original = new Error("disk failure");
      vi.spyOn(target[QinoPrimitiveMarker], "readOne").mockRejectedValueOnce(
        original,
      );

      const err = await fetchTargetEntry(target, "alice", ctx).catch(
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(Error);
      expect((err as Error).cause).toBe(original);
    });

    test("stringifies non-Error rejections and leaves cause undefined", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });
      vi.spyOn(target[QinoPrimitiveMarker], "readOne").mockRejectedValueOnce(
        "boom",
      );

      const err = await fetchTargetEntry(target, "alice", ctx).catch(
        (e: unknown) => e,
      );

      expect((err as Error).message).toMatch(/boom/);
      expect((err as Error).cause).toBeUndefined();
    });
  });

  describe("singleton target", () => {
    test("delegates to the source reader and returns the data", async () => {
      const data = { siteName: "Qino" };
      const target = makeDummySingleton({
        file: "/config/site.json",
        data,
      });
      const spy = vi.spyOn(target[QinoPrimitiveMarker], "readData");

      const result = await fetchTargetEntry(target, "ignored", ctx);

      expect(result).toEqual(data);
      expect(spy).toHaveBeenCalledWith();
    });

    test("wraps a source read error with the singleton file path", async () => {
      const target = makeDummySingleton({ file: "/config/site.json" });
      vi.spyOn(target[QinoPrimitiveMarker], "readData").mockRejectedValueOnce(
        new Error("parse error"),
      );

      await expect(fetchTargetEntry(target, "ignored", ctx)).rejects.toThrow(
        /author.*\/config\/site\.json.*post\.json.*parse error/,
      );
    });

    test("uses targetMeta.file (not directory) in the wrapped message", async () => {
      const target = makeDummySingleton({ file: "/config/site.json" });
      vi.spyOn(target[QinoPrimitiveMarker], "readData").mockRejectedValueOnce(
        new Error("nope"),
      );

      const err = await fetchTargetEntry(target, "ignored", ctx).catch(
        (e: unknown) => e,
      );

      expect(target[QinoPrimitiveMarker].is).toBe("singleton");
      expect((err as Error).message).toContain("/config/site.json");
      expect((err as Error).message).not.toContain("/ignored");
    });
  });
});

describe("tree target", () => {
  test("reads a nested entry through the raw source reader", async () => {
    const entry = makeDummyEntry({
      slug: "guides/setup",
      extension: ".md",
      fields: { title: "Setup" },
    });
    const target = makeDummyTree({
      directory: "/docs",
      extension: ".md",
      store: new Map([["guides/setup", entry]]),
    });
    const read = vi.spyOn(target[QinoPrimitiveMarker], "readEntry");
    const publicRead = vi.spyOn(target, "getEntry");
    expect(await fetchTargetEntry(target, "guides/setup", ctx)).toBe(entry);
    expect(read).toHaveBeenCalledWith("guides/setup");
    expect(publicRead).not.toHaveBeenCalled();
  });

  test("wraps missing tree entries with the source, field, and target path", async () => {
    const target = makeDummyTree({ directory: "/docs", extension: ".md" });
    await expect(
      fetchTargetEntry(target, "guides/missing", ctx),
    ).rejects.toThrow(/author.*\/docs\/guides\/missing.*post\.json.*ENOENT/);
  });
});
