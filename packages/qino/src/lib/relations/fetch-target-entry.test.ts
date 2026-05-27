import { describe, expect, test, vi } from "vitest";

import { QinoMeta } from "../../data/globals";
import {
  makeDummyCollection,
  makeDummyEntry,
  makeDummySingleton,
} from "../../utils/tests";
import { fetchTargetEntry } from "./fetch-target-entry";

const ctx = { sourceFilePath: "/fixtures/post.json", relationKey: "author" };

describe("fetchTargetEntry", () => {
  describe("collection target", () => {
    test("delegates to getOne with resolveRelations: false and returns the entry", async () => {
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
      const spy = vi.spyOn(target, "getOne");

      const result = await fetchTargetEntry(target, "alice", ctx);

      expect(result).toBe(entry);
      expect(spy).toHaveBeenCalledWith("alice", { resolveRelations: false });
    });

    test("wraps a getOne error with the collection directory and slug", async () => {
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
      vi.spyOn(target, "getOne").mockRejectedValueOnce(original);

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
      vi.spyOn(target, "getOne").mockRejectedValueOnce("boom");

      const err = await fetchTargetEntry(target, "alice", ctx).catch(
        (e: unknown) => e,
      );

      expect((err as Error).message).toMatch(/boom/);
      expect((err as Error).cause).toBeUndefined();
    });
  });

  describe("singleton target", () => {
    test("delegates to getData with resolveRelations: false and returns the data", async () => {
      const data = { siteName: "Qino" };
      const target = makeDummySingleton({
        file: "/config/site.json",
        data,
      });
      const spy = vi.spyOn(target, "getData");

      const result = await fetchTargetEntry(target, "ignored", ctx);

      expect(result).toEqual(data);
      expect(spy).toHaveBeenCalledWith({ resolveRelations: false });
    });

    test("wraps a getData error with the singleton file path", async () => {
      const target = makeDummySingleton({ file: "/config/site.json" });
      vi.spyOn(target, "getData").mockRejectedValueOnce(
        new Error("parse error"),
      );

      await expect(fetchTargetEntry(target, "ignored", ctx)).rejects.toThrow(
        /author.*\/config\/site\.json.*post\.json.*parse error/,
      );
    });

    test("uses targetMeta.file (not directory) in the wrapped message", async () => {
      const target = makeDummySingleton({ file: "/config/site.json" });
      vi.spyOn(target, "getData").mockRejectedValueOnce(new Error("nope"));

      const err = await fetchTargetEntry(target, "ignored", ctx).catch(
        (e: unknown) => e,
      );

      expect(target[QinoMeta].is).toBe("singleton");
      expect((err as Error).message).toContain("/config/site.json");
      expect((err as Error).message).not.toContain("/ignored");
    });
  });
});
