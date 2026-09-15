import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { DUMMY_INSTANCE_ID } from "../../test-utils/dummy-config";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyEntry } from "../../test-utils/make-dummy-entry";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import type { RelationTarget } from "../../types/relations";
import { createRelationResolver } from "./create-relation-resolver";
import { createResolveCache } from "./create-resolve-cache";

const sourceInstanceId = DUMMY_INSTANCE_ID;

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
        sourceInstanceId,
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
        sourceInstanceId,
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
        { relations: { author: target }, depth: 1, sourceInstanceId },
      );

      expect(result.author).toMatchObject({ name: "Alice" });
    });

    test("resolves an item reference via getData", async () => {
      const target = makeDummyItem({
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
        { relations: { site: target }, depth: 1, sourceInstanceId },
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
        { relations: { author: lazy }, depth: 1, sourceInstanceId },
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
        { relations: { author: undefined }, depth: 1, sourceInstanceId },
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
        {
          relations: { "profile.author": target },
          depth: 1,
          sourceInstanceId,
        },
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
        { relations: { "tags[*]": target }, depth: 1, sourceInstanceId },
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
      const getOneSpy = vi.spyOn(target[QinoPrimitiveMarker], "readOne");
      const resolver = createRelationResolver(createResolveCache());

      const [a, b] = await Promise.all([
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "first",
            extension: ".json",
            fields: { author: "authors/alice.json" },
          }),
          { relations: { author: target }, depth: 1, sourceInstanceId },
        ),
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "second",
            extension: ".json",
            fields: { author: "authors/alice.json" },
          }),
          { relations: { author: target }, depth: 1, sourceInstanceId },
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
      const authorsSpy = vi.spyOn(authors[QinoPrimitiveMarker], "readOne");
      const editorsSpy = vi.spyOn(editors[QinoPrimitiveMarker], "readOne");

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
        {
          relations: { author: authors, editor: editors },
          depth: 1,
          sourceInstanceId,
        },
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
          { relations: { author: target }, depth: 1, sourceInstanceId },
        ),
      ).rejects.toThrow(/author.*authors\/missing.*post\.json/);
    });
  });

  describe("cross-instance enforcement", () => {
    test("throws when a relation target was created by a different Qino instance", async () => {
      const otherInstanceId = Symbol("qino.other");
      const target = makeDummyCollection({
        directory: "/authors",
        extension: ".json",
        instanceId: otherInstanceId,
      });
      const resolver = createRelationResolver(createResolveCache());

      await expect(
        resolver.resolveEntry(
          makeDummyEntry({
            slug: "post",
            extension: ".json",
            fields: { author: "authors/alice.json" },
          }),
          { relations: { author: target }, depth: 1, sourceInstanceId },
        ),
      ).rejects.toThrow(/different createQino/);
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
        { relations: { author: authors }, depth: 1, sourceInstanceId },
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
        { relations: { author: authors }, depth: 2, sourceInstanceId },
      );

      expect(result.author).toMatchObject({
        name: "Alice",
        avatar: { url: "https://example.com/portrait.png" },
      });
    });
  });
});

describe("tree references", () => {
  test("deduplicates nested and array references, follows cross-kind cycles, and stops at depth", async () => {
    const treeEntry = makeDummyEntry({
      slug: "guides/setup",
      extension: ".md",
      fields: { title: "Setup", post: "posts/hello.json" },
    });
    const post = makeDummyEntry({
      slug: "hello",
      extension: ".json",
      fields: { doc: "docs/guides/setup.md" },
    });
    const treeRelations: Record<string, RelationTarget> = {};
    const docs = makeDummyTree({
      directory: "/docs",
      extension: ".md",
      store: new Map([["guides/setup", treeEntry]]),
      relations: treeRelations,
    });
    const posts = makeDummyCollection({
      directory: "/posts",
      extension: ".json",
      store: new Map([["hello", post]]),
      relations: { doc: () => docs },
    });
    treeRelations.post = posts;
    const read = vi.spyOn(docs[QinoPrimitiveMarker], "readEntry");
    const source = makeDummyEntry({
      slug: "source",
      extension: ".json",
      fields: {
        links: ["docs/guides/setup.md", "/docs/guides/setup.md"],
        section: { doc: "docs/guides/setup.md" },
      },
    });
    const result = await createRelationResolver(
      createResolveCache(),
    ).resolveEntry(source, {
      relations: { "links[*]": docs, "section.doc": () => docs },
      depth: 3,
      sourceInstanceId,
    });
    const resolved = {
      title: "Setup",
      post: { doc: { title: "Setup", post: "posts/hello.json" } },
    };
    expect(result).toMatchObject({
      links: [resolved, resolved],
      section: { doc: resolved },
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(treeEntry.post).toBe("posts/hello.json");
    expect(post.doc).toBe("docs/guides/setup.md");
  });

  test("rejects tree targets from a different instance", async () => {
    const docs = makeDummyTree({
      directory: "/docs",
      extension: ".md",
      instanceId: Symbol("other"),
    });
    const source = makeDummyEntry({
      slug: "source",
      extension: ".json",
      fields: { doc: "docs/setup.md" },
    });
    await expect(
      createRelationResolver(createResolveCache()).resolveEntry(source, {
        relations: { doc: () => docs },
        depth: 1,
        sourceInstanceId,
      }),
    ).rejects.toThrow(/doc.*source.json.*different createQino/);
  });
});
