import { describe, expect, test } from "vitest";
import type { AnyCollection } from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { QinoMeta } from "../globals";
import { resolveEntry } from "./resolve-entry";
import { createResolveCache } from "./create-resolve-cache";

type Entry = Record<string, unknown> & {
  _meta: { slug: string; fileName: string; filePath: string };
};

function makeCollection({
  directory,
  relations = {},
  store,
}: {
  directory: string;
  relations?: Record<string, AnyCollection | (() => AnyCollection)>;
  store: Map<string, Entry>;
}): AnyCollection {
  let getOneCalls = 0;
  const collection = {
    [QinoMeta]: {
      schema: {} as never,
      directory,
      extension: ".json" as const,
      relations,
      resolveRelations: true as ResolveOption,
    },
    getAll: async () => Array.from(store.values()) as never,
    getOne: async (slug: string) => {
      getOneCalls += 1;
      const entry = store.get(slug);
      if (!entry) throw new Error(`ENOENT: ${directory}/${slug}`);
      return entry as never;
    },
  } as AnyCollection;
  (collection as unknown as { getOneCalls: () => number }).getOneCalls = () =>
    getOneCalls;
  return collection;
}

function entry(slug: string, fields: Record<string, unknown>): Entry {
  return {
    _meta: {
      slug,
      fileName: `${slug}.json`,
      filePath: `/fixtures/${slug}.json`,
    },
    ...fields,
  };
}

describe("resolveEntry", () => {
  test("resolveRelations: false returns the entry unchanged", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      ["hello", entry("hello", { title: "Hi", author: "authors/alice.json" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(
      posts.get("hello")!,
      postCol,
      false,
      cache,
    );
    expect(resolved.author).toBe("authors/alice.json");
  });

  test("depth 1 resolves top-level relations to full entries", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      ["hello", entry("hello", { title: "Hi", author: "authors/alice.json" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(posts.get("hello")!, postCol, 1, cache);
    expect(resolved.author).toMatchObject({ name: "Alice" });
    expect((resolved.author as Entry)._meta.slug).toBe("alice");
  });

  test("resolves array-of-strings relations (categories[*])", async () => {
    const cats = new Map([
      ["dev", entry("dev", { name: "Dev" })],
      ["ops", entry("ops", { name: "Ops" })],
    ]);
    const catCol = makeCollection({ directory: "/categories", store: cats });
    const posts = new Map([
      [
        "hello",
        entry("hello", {
          title: "Hi",
          categories: ["categories/dev.json", "categories/ops.json"],
        }),
      ],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { "categories[*]": catCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(posts.get("hello")!, postCol, 1, cache);
    expect(resolved.categories).toEqual([
      expect.objectContaining({ name: "Dev" }),
      expect.objectContaining({ name: "Ops" }),
    ]);
  });

  test("dedupes shared targets across entries in one call", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      ["a", entry("a", { title: "A", author: "authors/alice.json" })],
      ["b", entry("b", { title: "B", author: "authors/alice.json" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const [aResolved, bResolved] = await Promise.all([
      resolveEntry(posts.get("a")!, postCol, 1, cache),
      resolveEntry(posts.get("b")!, postCol, 1, cache),
    ]);
    expect(aResolved.author).toBe(bResolved.author); // same object identity
    expect(
      (authorCol as unknown as { getOneCalls: () => number }).getOneCalls(),
    ).toBe(1);
  });

  test("cycles terminate at the depth cap (true resolves up to 6)", async () => {
    const authors = new Map([
      [
        "alice",
        entry("alice", {
          name: "Alice",
          favoritePost: "posts/hello.json",
        }),
      ],
    ]);
    const posts = new Map([
      ["hello", entry("hello", { title: "Hi", author: "authors/alice.json" })],
    ]);
    let authorCol!: AnyCollection;
    let postCol!: AnyCollection;
    authorCol = makeCollection({
      directory: "/authors",
      store: authors,
      relations: { favoritePost: () => postCol },
    });
    postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(
      posts.get("hello")!,
      postCol,
      true,
      cache,
    );
    // depth 6: post -> author -> post -> author -> post -> author -> (string)
    // Walk down to the deepest resolved node and confirm it bottoms out as a string.
    let node: unknown = resolved;
    let levels = 0;
    while (
      node &&
      typeof node == "object" &&
      !Array.isArray(node) &&
      "author" in (node as Record<string, unknown>)
    ) {
      const next = (node as Record<string, unknown>).author;
      if (typeof next == "string") {
        break;
      }
      node = (next as Record<string, unknown>).favoritePost;
      levels += 1;
      if (levels > 20) throw new Error("Cycle did not terminate");
    }
    expect(levels).toBeGreaterThan(0);
    expect(levels).toBeLessThanOrEqual(6);
  });

  test("broken reference throws with source filePath and relation key", async () => {
    const authors = new Map<string, Entry>();
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      [
        "hello",
        entry("hello", { title: "Hi", author: "authors/missing.json" }),
      ],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(
      resolveEntry(posts.get("hello")!, postCol, 1, cache),
    ).rejects.toThrow(/author.*\/authors\/missing.*\/fixtures\/hello\.json/);
  });

  test("empty-string relation throws with source filePath and relation key", async () => {
    const authors = new Map<string, Entry>();
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      ["hello", entry("hello", { title: "Hi", author: "" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(
      resolveEntry(posts.get("hello")!, postCol, 1, cache),
    ).rejects.toThrow(
      /empty relation reference.*author.*\/fixtures\/hello\.json/i,
    );
  });

  test("prefix mismatch throws naming the expected target", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      // value points at `posts/` but should point at `authors/`
      ["hello", entry("hello", { title: "Hi", author: "posts/alice.json" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(
      resolveEntry(posts.get("hello")!, postCol, 1, cache),
    ).rejects.toThrow(/author.*authors\/.*posts\/alice\.json/);
  });

  test("extension mismatch throws naming the expected extension", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      // target is `.json` but value uses `.md`
      ["hello", entry("hello", { title: "Hi", author: "authors/alice.md" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(
      resolveEntry(posts.get("hello")!, postCol, 1, cache),
    ).rejects.toThrow(/author.*\.json.*authors\/alice\.md/);
  });

  test("leading slash on relation value is tolerated", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const posts = new Map([
      ["hello", entry("hello", { title: "Hi", author: "/authors/alice.json" })],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(posts.get("hello")!, postCol, 1, cache);
    expect(resolved.author).toMatchObject({ name: "Alice" });
  });
});
