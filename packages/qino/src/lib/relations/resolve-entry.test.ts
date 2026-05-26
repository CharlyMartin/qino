import { describe, expect, test } from "vitest";

import type { AnyCollection, AnySingleton } from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { QinoMeta } from "../globals";
import { createResolveCache } from "./create-resolve-cache";
import { resolveEntry } from "./resolve-entry";

type Entry = Record<string, unknown> & {
  _meta: { slug: string; fileName: string; filePath: string };
};

function makeCollection({
  directory,
  relations = {},
  store,
}: {
  directory: string;
  relations?: Record<
    string,
    AnyCollection | AnySingleton | (() => AnyCollection | AnySingleton)
  >;
  store: Map<string, Entry>;
}): AnyCollection {
  let getOneCalls = 0;
  const collection = {
    [QinoMeta]: {
      is: "collection" as const,
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
    const helloPost = entry("hello", {
      title: "Hi",
      author: "authors/alice.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, false, cache);
    expect(resolved.author).toBe("authors/alice.json");
  });

  test("depth 1 resolves top-level relations to full entries", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const helloPost = entry("hello", {
      title: "Hi",
      author: "authors/alice.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, 1, cache);
    expect(resolved.author).toMatchObject({ name: "Alice" });
    expect((resolved.author as Entry)._meta.slug).toBe("alice");
  });

  test("resolves array-of-strings relations (categories[*])", async () => {
    const cats = new Map([
      ["dev", entry("dev", { name: "Dev" })],
      ["ops", entry("ops", { name: "Ops" })],
    ]);
    const catCol = makeCollection({ directory: "/categories", store: cats });
    const helloPost = entry("hello", {
      title: "Hi",
      categories: ["categories/dev.json", "categories/ops.json"],
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { "categories[*]": catCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, 1, cache);
    expect(resolved.categories).toEqual([
      expect.objectContaining({ name: "Dev" }),
      expect.objectContaining({ name: "Ops" }),
    ]);
  });

  test("dedupes shared targets across entries in one call", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const aPost = entry("a", { title: "A", author: "authors/alice.json" });
    const bPost = entry("b", { title: "B", author: "authors/alice.json" });
    const posts = new Map([
      ["a", aPost],
      ["b", bPost],
    ]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const [aResolved, bResolved] = await Promise.all([
      resolveEntry(aPost, postCol, 1, cache),
      resolveEntry(bPost, postCol, 1, cache),
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
    const helloPost = entry("hello", {
      title: "Hi",
      author: "authors/alice.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const authorCol = makeCollection({
      directory: "/authors",
      store: authors,
      relations: { favoritePost: () => postCol },
    });
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, true, cache);
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
    const helloPost = entry("hello", {
      title: "Hi",
      author: "authors/missing.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(resolveEntry(helloPost, postCol, 1, cache)).rejects.toThrow(
      /author.*\/authors\/missing.*\/fixtures\/hello\.json/,
    );
  });

  test("empty-string relation throws with source filePath and relation key", async () => {
    const authors = new Map<string, Entry>();
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const helloPost = entry("hello", { title: "Hi", author: "" });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(resolveEntry(helloPost, postCol, 1, cache)).rejects.toThrow(
      /empty relation reference.*author.*\/fixtures\/hello\.json/i,
    );
  });

  test("prefix mismatch throws naming the expected target", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    // value points at `posts/` but should point at `authors/`
    const helloPost = entry("hello", {
      title: "Hi",
      author: "posts/alice.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(resolveEntry(helloPost, postCol, 1, cache)).rejects.toThrow(
      /author.*authors\/.*posts\/alice\.json/,
    );
  });

  test("extension mismatch throws naming the expected extension", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    // target is `.json` but value uses `.md`
    const helloPost = entry("hello", {
      title: "Hi",
      author: "authors/alice.md",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    await expect(resolveEntry(helloPost, postCol, 1, cache)).rejects.toThrow(
      /author.*\.json.*authors\/alice\.md/,
    );
  });

  test("leading slash on relation value is tolerated", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const helloPost = entry("hello", {
      title: "Hi",
      author: "/authors/alice.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, 1, cache);
    expect(resolved.author).toMatchObject({ name: "Alice" });
  });
});

type SingletonEntry = Record<string, unknown> & {
  _meta: { fileName: string; filePath: string };
};

function makeSingleton({
  file,
  relations = {},
  data,
}: {
  file: `/${string}`;
  relations?: Record<
    string,
    AnyCollection | AnySingleton | (() => AnyCollection | AnySingleton)
  >;
  data: SingletonEntry;
}): AnySingleton {
  return {
    [QinoMeta]: {
      is: "singleton" as const,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations,
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}

function singletonEntry(
  file: string,
  fields: Record<string, unknown>,
): SingletonEntry {
  return {
    _meta: {
      fileName: file.slice(file.lastIndexOf("/") + 1),
      filePath: `/fixtures${file}`,
    },
    ...fields,
  };
}

describe("singleton targets", () => {
  test("collection → singleton resolves via getData", async () => {
    const siteConfig = singletonEntry("/config/site.json", {
      siteName: "Qino",
    });
    const configSingleton = makeSingleton({
      file: "/config/site.json",
      data: siteConfig,
    });
    const helloPost = entry("hello", {
      title: "Hi",
      siteConfig: "config/site.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { siteConfig: configSingleton },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, 1, cache);
    expect(resolved.siteConfig).toMatchObject({ siteName: "Qino" });
  });

  test("singleton-as-host getData resolves its own relation to a collection entry", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const authorCol = makeCollection({ directory: "/authors", store: authors });
    const homeData = singletonEntry("/pages/home.md", {
      title: "Home",
      author: "authors/alice.json",
    });
    const homeSingleton = makeSingleton({
      file: "/pages/home.md",
      data: homeData,
      relations: { author: authorCol },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(homeData, homeSingleton, 1, cache);
    expect(resolved.author).toMatchObject({ name: "Alice" });
  });

  test("singleton target value mismatch throws naming the expected file", async () => {
    const configSingleton = makeSingleton({
      file: "/config/site.json",
      data: singletonEntry("/config/site.json", { siteName: "Qino" }),
    });
    const helloPost = entry("hello", {
      title: "Hi",
      siteConfig: "config/other.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { siteConfig: configSingleton },
    });
    const cache = createResolveCache();
    await expect(resolveEntry(helloPost, postCol, 1, cache)).rejects.toThrow(
      /siteConfig.*config\/site\.json.*config\/other\.json/,
    );
  });

  test("leading slash on singleton relation value is tolerated", async () => {
    const configSingleton = makeSingleton({
      file: "/config/site.json",
      data: singletonEntry("/config/site.json", { siteName: "Qino" }),
    });
    const helloPost = entry("hello", {
      title: "Hi",
      siteConfig: "/config/site.json",
    });
    const posts = new Map([["hello", helloPost]]);
    const postCol = makeCollection({
      directory: "/posts",
      store: posts,
      relations: { siteConfig: configSingleton },
    });
    const cache = createResolveCache();
    const resolved = await resolveEntry(helloPost, postCol, 1, cache);
    expect(resolved.siteConfig).toMatchObject({ siteName: "Qino" });
  });
});
