import { describe, expect, test, vi } from "vitest";

import {
  makeDummyCollection,
  makeDummyEntry,
  makeDummySingleton,
} from "../../utils/tests";
import { createRelationResolver } from "./create-relation-resolver";
import { createResolveCache } from "./create-resolve-cache";

describe("createRelationResolver", () => {
  describe("depth gate", () => {
    test("returns the entry unchanged when depth is 0", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });
      const entry = makeDummyEntry({
        slug: "post",
        extension: ".json",
        fields: { author: "authors/alice.json" },
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(entry, {
        relations: { author: target },
        depth: 0,
      });

      expect(result).toBe(entry);
      expect(result.author).toBe("authors/alice.json");
    });

    test("returns the entry unchanged when depth is negative", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });
      const entry = makeDummyEntry({
        slug: "post",
        extension: ".json",
        fields: { author: "authors/alice.json" },
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(entry, {
        relations: { author: target },
        depth: -1,
      });

      expect(result).toBe(entry);
    });
  });

  describe("top-level resolution", () => {
    test("replaces a collection slug with the fetched entry", async () => {
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice" },
      });
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { author: "authors/alice.json" },
        }),
        { relations: { author: target }, depth: 1 },
      );

      expect(result.author).toMatchObject({ name: "Alice" });
    });

    test("resolves a singleton reference via getData", async () => {
      const target = makeDummySingleton({
        file: "/config/site.json",
        data: { siteName: "Qino" },
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { site: "config/site.json" },
        }),
        { relations: { site: target }, depth: 1 },
      );

      expect(result.site).toMatchObject({ siteName: "Qino" });
    });

    test("invokes a lazy target function and resolves the returned target", async () => {
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice" },
      });
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
      });
      const lazy = vi.fn(() => target);
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { author: "authors/alice.json" },
        }),
        { relations: { author: lazy }, depth: 1 },
      );

      expect(lazy).toHaveBeenCalled();
      expect(result.author).toMatchObject({ name: "Alice" });
    });

    test("skips a relation whose target is undefined", async () => {
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { author: "authors/alice.json" },
        }),
        { relations: { author: undefined }, depth: 1 },
      );

      expect(result.author).toBe("authors/alice.json");
    });
  });

  describe("path traversal", () => {
    test("resolves a nested object path", async () => {
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice" },
      });
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { profile: { author: "authors/alice.json" } },
        }),
        { relations: { "profile.author": target }, depth: 1 },
      );

      expect(result.profile).toMatchObject({ author: { name: "Alice" } });
    });

    test("resolves each item of an array path", async () => {
      const a = makeDummyEntry({
        slug: "a",
        extension: ".json",
        fields: { label: "A" },
      });
      const b = makeDummyEntry({
        slug: "b",
        extension: ".json",
        fields: { label: "B" },
      });
      const target = makeDummyCollection({
        directory: "/tags",
        extension: ".json",
        store: new Map([
          ["a", a],
          ["b", b],
        ]),
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { tags: ["tags/a.json", "tags/b.json"] },
        }),
        { relations: { "tags[*]": target }, depth: 1 },
      );

      expect(result.tags).toMatchObject([{ label: "A" }, { label: "B" }]);
    });
  });

  describe("cache behavior", () => {
    test("dedupes concurrent lookups for the same slug via the shared cache", async () => {
      const authors = new Map([
        [
          "alice",
          makeDummyEntry({
            slug: "alice",
            extension: ".json",
            fields: { name: "Alice" },
          }),
        ],
      ]);
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: authors,
      });
      const getOneSpy = vi.spyOn(target, "getOne");
      const resolver = createRelationResolver(createResolveCache());

      const [a, b] = await Promise.all([
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "first",
            extension: ".json",
            fields: { author: "authors/alice.json" },
          }),
          { relations: { author: target }, depth: 1 },
        ),
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "second",
            extension: ".json",
            fields: { author: "authors/alice.json" },
          }),
          { relations: { author: target }, depth: 1 },
        ),
      ]);

      expect(a.author).toBe(b.author);
      expect(getOneSpy).toHaveBeenCalledTimes(1);
    });

    test("keys the cache per target so unrelated collections do not share entries", async () => {
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { kind: "author" },
      });
      const aliceEditor = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { kind: "editor" },
      });
      const authors = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
      });
      const editors = makeDummyCollection({
        directory: "/editors",
        extension: ".json",
        store: new Map([["alice", aliceEditor]]),
      });
      const authorsSpy = vi.spyOn(authors, "getOne");
      const editorsSpy = vi.spyOn(editors, "getOne");

      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: {
            author: "authors/alice.json",
            editor: "editors/alice.json",
          },
        }),
        { relations: { author: authors, editor: editors }, depth: 1 },
      );

      expect(result.author).toMatchObject({ kind: "author" });
      expect(result.editor).toMatchObject({ kind: "editor" });
      expect(authorsSpy).toHaveBeenCalledTimes(1);
      expect(editorsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("error propagation", () => {
    test("propagates a missing-target error from fetchTargetEntry with relation context", async () => {
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
      });
      const resolver = createRelationResolver(createResolveCache());

      await expect(
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "post",
            extension: ".json",
            fields: { author: "authors/missing.json" },
          }),
          { relations: { author: target }, depth: 1 },
        ),
      ).rejects.toThrow(/author.*authors\/missing.*post\.json/);
    });
  });

  describe("depth recursion", () => {
    test("stops at depth 1 and leaves nested relations as raw strings", async () => {
      const portrait = makeDummyEntry({
        slug: "portrait",
        extension: ".json",
        fields: { url: "https://example.com/portrait.png" },
      });
      const media = makeDummyCollection({
        directory: "/media",
        extension: ".json",
        store: new Map([["portrait", portrait]]),
      });
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice", avatar: "media/portrait.json" },
      });
      const authors = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
        relations: { avatar: media },
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { author: "authors/alice.json" },
        }),
        { relations: { author: authors }, depth: 1 },
      );

      expect(result.author).toMatchObject({
        name: "Alice",
        avatar: "media/portrait.json",
      });
    });

    test("recurses one level deeper at depth 2 and resolves nested relations", async () => {
      const portrait = makeDummyEntry({
        slug: "portrait",
        extension: ".json",
        fields: { url: "https://example.com/portrait.png" },
      });
      const media = makeDummyCollection({
        directory: "/media",
        extension: ".json",
        store: new Map([["portrait", portrait]]),
      });
      const alice = makeDummyEntry({
        slug: "alice",
        extension: ".json",
        fields: { name: "Alice", avatar: "media/portrait.json" },
      });
      const authors = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        store: new Map([["alice", alice]]),
        relations: { avatar: media },
      });
      const resolver = createRelationResolver(createResolveCache());

      const result = await resolver.resolveEntry(
        makeDummyEntry({
          slug: "post",
          extension: ".json",
          fields: { author: "authors/alice.json" },
        }),
        { relations: { author: authors }, depth: 2 },
      );

      expect(result.author).toMatchObject({
        name: "Alice",
        avatar: { url: "https://example.com/portrait.png" },
      });
    });
  });
});
