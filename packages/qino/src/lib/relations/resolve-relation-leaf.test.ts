import { describe, expect, test } from "vitest";

import type { AnyCollection, AnySingleton } from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { QinoMeta } from "../globals";
import { createResolveCache } from "./create-resolve-cache";
import { resolveRelationLeaf } from "./resolve-relation-leaf";

type Entry = Record<string, unknown> & {
  _meta: { slug: string; fileName: string; filePath: string };
};

function entry(slug: string, fields: Record<string, unknown> = {}): Entry {
  return {
    _meta: {
      slug,
      fileName: `${slug}.json`,
      filePath: `/fixtures/${slug}.json`,
    },
    ...fields,
  };
}

function makeCollection(
  directory: string,
  store: Map<string, Entry> = new Map(),
): AnyCollection {
  return {
    [QinoMeta]: {
      is: "collection",
      schema: {} as never,
      directory,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getAll: async () => Array.from(store.values()) as never,
    getOne: async (slug: string) => {
      const found = store.get(slug);
      if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
      return found as never;
    },
  } as AnyCollection;
}

function makeSingleton(
  file: `/${string}`,
  data: Record<string, unknown>,
): AnySingleton {
  return {
    [QinoMeta]: {
      is: "singleton",
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}

const baseCtx = () => ({
  relationKey: "author",
  sourceFilePath: "/fixtures/post.json",
  depth: 0,
  cache: createResolveCache(),
});

describe("resolveRelationLeaf", () => {
  test("rejects a numeric leaf with the typeof in the message", async () => {
    const target = makeCollection("/authors");
    await expect(
      resolveRelationLeaf(42, { ...baseCtx(), target }),
    ).rejects.toThrow(/author.*post\.json.*number/);
  });

  test("rejects a null leaf (typeof null is 'object')", async () => {
    const target = makeCollection("/authors");
    await expect(
      resolveRelationLeaf(null, { ...baseCtx(), target }),
    ).rejects.toThrow(/author.*post\.json.*object/);
  });

  test("rejects an empty-string leaf with a dedicated message", async () => {
    const target = makeCollection("/authors");
    await expect(
      resolveRelationLeaf("", { ...baseCtx(), target }),
    ).rejects.toThrow(/empty relation reference.*author.*post\.json/i);
  });

  test("resolves a collection reference to the fetched entry", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const target = makeCollection("/authors", authors);
    const result = await resolveRelationLeaf("authors/alice.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ name: "Alice" });
  });

  test("resolves a singleton reference via getData", async () => {
    const target = makeSingleton("/config/site.json", { siteName: "Qino" });
    const result = await resolveRelationLeaf("config/site.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ siteName: "Qino" });
  });

  test("tolerates a leading slash on the reference value", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const target = makeCollection("/authors", authors);
    const result = await resolveRelationLeaf("/authors/alice.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ name: "Alice" });
  });

  test("propagates a prefix mismatch error from parseRelationValue", async () => {
    const target = makeCollection(
      "/authors",
      new Map([["alice", entry("alice")]]),
    );
    await expect(
      resolveRelationLeaf("posts/alice.json", { ...baseCtx(), target }),
    ).rejects.toThrow(/expected value under "authors\/".*posts\/alice\.json/);
  });

  test("propagates a missing-target error from fetchAndResolve", async () => {
    const target = makeCollection("/authors");
    await expect(
      resolveRelationLeaf("authors/missing.json", { ...baseCtx(), target }),
    ).rejects.toThrow(/author.*authors\/missing.*post\.json/);
  });

  test("dedupes repeated lookups for the same slug via the shared cache", async () => {
    let getOneCalls = 0;
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const target = {
      [QinoMeta]: {
        is: "collection",
        schema: {} as never,
        directory: "/authors",
        extension: ".json" as const,
        relations: {},
        resolveRelations: true as ResolveOption,
      },
      getAll: async () => Array.from(authors.values()) as never,
      getOne: async (slug: string) => {
        getOneCalls += 1;
        const found = authors.get(slug);
        if (!found) throw new Error(`ENOENT: /authors/${slug}`);
        return found as never;
      },
    } as AnyCollection;

    const ctx = { ...baseCtx(), target };
    const [a, b] = await Promise.all([
      resolveRelationLeaf("authors/alice.json", ctx),
      resolveRelationLeaf("authors/alice.json", ctx),
    ]);
    expect(a).toBe(b);
    expect(getOneCalls).toBe(1);
  });
});
