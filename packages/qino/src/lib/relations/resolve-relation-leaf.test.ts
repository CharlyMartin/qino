import { describe, expect, test } from "vitest";

import { QinoMeta } from "../../data/globals";
import type { AnyCollection, AnyEntry, AnySingleton } from "../../types";
import type { ResolveOption } from "../../types/resolve";
import { createRelationResolver } from "./create-relation-resolver";
import { createResolveCache } from "./create-resolve-cache";
import { resolveRelationLeaf } from "./resolve-relation-leaf";

type Entry = AnyEntry & {
  _meta: {
    slug: string;
    fileName: `${string}.json`;
    filePath: `${string}.json`;
  };
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
  resolveTargetReference: async (slug: string) => ({ slug }),
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

  test("parses a collection reference and delegates target resolution", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const target = makeCollection("/authors", authors);
    const result = await resolveRelationLeaf("authors/alice.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ slug: "alice" });
  });

  test("parses a singleton reference and delegates target resolution", async () => {
    const target = makeSingleton("/config/site.json", { siteName: "Qino" });
    const result = await resolveRelationLeaf("config/site.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ slug: "config/site.json" });
  });

  test("tolerates a leading slash on the reference value", async () => {
    const authors = new Map([["alice", entry("alice", { name: "Alice" })]]);
    const target = makeCollection("/authors", authors);
    const result = await resolveRelationLeaf("/authors/alice.json", {
      ...baseCtx(),
      target,
    });
    expect(result).toMatchObject({ slug: "alice" });
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

  test("propagates a missing-target error from the resolver", async () => {
    const target = makeCollection("/authors");
    const resolver = createRelationResolver(createResolveCache());

    await expect(
      resolver.resolveEntry(entry("post", { author: "authors/missing.json" }), {
        relations: { author: target },
        depth: 1,
      }),
    ).rejects.toThrow(/author.*authors\/missing.*post\.json/);
  });

  test("resolves a singleton reference via getData", async () => {
    const target = makeSingleton("/config/site.json", { siteName: "Qino" });
    const resolver = createRelationResolver(createResolveCache());

    const result = await resolver.resolveEntry(
      entry("post", { site: "config/site.json" }),
      {
        relations: { site: target },
        depth: 1,
      },
    );

    expect(result.site).toMatchObject({ siteName: "Qino" });
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

    const resolver = createRelationResolver(createResolveCache());
    const [a, b] = await Promise.all([
      resolver.resolveEntry(entry("first", { author: "authors/alice.json" }), {
        relations: { author: target },
        depth: 1,
      }),
      resolver.resolveEntry(entry("second", { author: "authors/alice.json" }), {
        relations: { author: target },
        depth: 1,
      }),
    ]);
    expect(a.author).toBe(b.author);
    expect(getOneCalls).toBe(1);
  });
});
