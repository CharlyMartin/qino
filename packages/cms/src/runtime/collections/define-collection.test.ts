import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { validateCollection } from "../../cli/check/validate-collection";
import { QinoPrimitiveMarker } from "../../data/globals";
import { initQino } from "../qino/init-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-collection-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("defineCollection", () => {
  test("adds derived fields using the entry markdown and metadata", async () => {
    const posts = nodePath.join(tmp, "posts");
    await fs.mkdir(posts);
    await fs.writeFile(
      nodePath.join(posts, "hello.md"),
      ["---", "title: Hello", "---", "", "One two three"].join("\n"),
    );

    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      views: (view) => ({
        default: view({
          augment: ({ markdown, _meta }) => ({
            words: markdown.trim().split(/\s+/u).length,
            sourceFile: _meta.fileName,
          }),
        }),
      }),
      directory: "/posts",
      schema: z.object({ markdown: z.string(), title: z.string() }).strict(),
      extension: ".md",
    });

    await expect(collection.getOne("hello")).resolves.toMatchObject({
      words: 3,
      sourceFile: "hello.md",
    });
  });
});

async function writeMd(relPath: string, title: string) {
  const filePath = nodePath.join(tmp, "posts", relPath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    ["---", `title: ${title}`, "---", "", `# ${title}`].join("\n"),
  );
}

function makeCollection() {
  const { defineCollection } = initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
  });
  return defineCollection({
    directory: "/posts",
    schema: z.object({
      markdown: z.string(),
      title: z.string(),
    }),
    extension: ".md",
  });
}

describe("getAllSlugs", () => {
  test("returns each entry's slug, sorted", async () => {
    await writeMd("second.md", "Second");
    await writeMd("first.md", "First");

    expect(await makeCollection().getAllSlugs()).toEqual(["first", "second"]);
  });

  test("ignores files in subdirectories (collections are flat)", async () => {
    await writeMd("first.md", "First");
    await writeMd("guides/intro.md", "Intro");

    expect(await makeCollection().getAllSlugs()).toEqual(["first"]);
  });

  test("returns an empty array for an empty collection", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"), { recursive: true });

    expect(await makeCollection().getAllSlugs()).toEqual([]);
  });

  test("returns an empty array for a missing directory", async () => {
    expect(await makeCollection().getAllSlugs()).toEqual([]);
  });

  test("ignores hidden files", async () => {
    await writeMd(".hidden.md", "Hidden");
    await writeMd("visible.md", "Visible");

    expect(await makeCollection().getAllSlugs()).toEqual(["visible"]);
  });

  test.each([".md", ".mdx", ".markdown", ".json"] as const)(
    "filters by %s and strips only the trailing extension",
    async (extension) => {
      for (const ext of [".md", ".mdx", ".markdown", ".json", ".txt"]) {
        await writeMd(`post${ext}`, "Post");
      }
      await writeMd(`release.v1${extension}${extension}`, "Release");
      await writeMd(`backup${extension}.bak`, "Backup");
      const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
      const collection = qino.defineCollection({
        directory: "/posts",
        extension,
        schema: z.object({ markdown: z.string(), title: z.string() }),
      });

      expect(await collection.getAllSlugs()).toEqual([
        "post",
        `release.v1${extension}`,
      ]);
    },
  );

  test("includes malformed and schema-invalid content", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(nodePath.join(tmp, "posts/malformed.json"), "{");
    await fs.writeFile(nodePath.join(tmp, "posts/invalid.json"), "{}");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".json",
      schema: z.object({ markdown: z.string(), title: z.string() }),
    });

    expect(await collection.getAllSlugs()).toEqual(["invalid", "malformed"]);
    await expect(collection.getOne("malformed")).rejects.toThrow();
    await expect(collection.getOne("invalid")).rejects.toThrow();
  });

  test("never reads content, validates schemas, resolves relations, or runs augment", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(
      nodePath.join(tmp, "posts/hello.json"),
      JSON.stringify({ title: "Hello", author: "/authors/alice.json" }),
    );
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const authors = qino.defineCollection({
      directory: "/authors",
      extension: ".json",
      schema: z.object({ name: z.string() }),
    });
    const validate = vi.fn(() => {
      throw new Error("Schema must not run");
    });
    const relation = vi.fn(() => authors);
    const augment = vi.fn(() => {
      throw new Error("Augment must not run");
    });
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".json",
      schema: z
        .object({ markdown: z.string(), title: z.string(), author: z.string() })
        .superRefine(validate),
      relations: { author: relation },
      views: (view) => ({
        default: view({
          resolveRelations: true,
          augment,
        }),
        detail: view({ resolveRelations: true, augment }),
      }),
    });
    const readFile = vi
      .spyOn(fs, "readFile")
      .mockRejectedValue(new Error("Content must not be read"));

    expect(await collection.getAllSlugs()).toEqual(["hello"]);
    expect(readFile).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(relation).not.toHaveBeenCalled();
    expect(augment).not.toHaveBeenCalled();
  });
});

describe("collection filter and sort", () => {
  test("constructs helper views once and keeps view-name validation", async () => {
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const created = vi.fn();
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
      views: (view) => {
        created();
        return { default: view({}), listing: view({ filter: () => true }) };
      },
    });
    expect(created).toHaveBeenCalledTimes(1);
    await collection.getMany({ view: "listing" });
    await collection.getMany({ view: "listing" });
    expect(created).toHaveBeenCalledTimes(1);
    await expect(
      collection.getMany({ view: "missing" } as never),
    ).rejects.toThrow(/Unknown view/);
    expect(() =>
      qino.defineCollection({
        directory: "/posts",
        extension: ".md",
        schema: z.object({ markdown: z.string(), title: z.string() }),
        views: (() => ({ default: {} })) as never,
      }),
    ).toThrow(/View "default" must be created/);
  });

  test("awaits all augmentation, filters before sorting, and keeps views independent", async () => {
    await writeMd("a.md", "Long title");
    await writeMd("b.md", "Draft");
    await writeMd("c.md", "Short");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const events: string[] = [];
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
      views: (view) => ({
        default: view({
          augment: async (entry) => {
            await Promise.resolve();
            events.push(`augment:${entry._meta.slug}`);
            return { length: entry.title.length };
          },
          filter: (entry) => {
            expect(
              events.filter((event) => event.startsWith("augment:")),
            ).toHaveLength(3);
            events.push(`filter:${entry._meta.slug}`);
            return entry.title != "Draft" && entry.length > 0;
          },
          sort: (a, b) => {
            expect(
              events.filter((event) => event.startsWith("filter:")),
            ).toHaveLength(3);
            expect([a.title, b.title]).not.toContain("Draft");
            events.push("sort");
            return a.length - b.length;
          },
        }),
        baseline: view({}),
        drafts: view({
          augment: (entry) => ({ draft: entry.title == "Draft" }),
          filter: (entry) => entry.draft,
        }),
        descending: view({ sort: (a, b) => b.title.length - a.title.length }),
      }),
    });
    expect((await collection.getMany()).map((entry) => entry.title)).toEqual([
      "Short",
      "Long title",
    ]);
    const baseline = await collection.getMany({ view: "baseline" });
    expect(baseline).toHaveLength(3);
    expect(baseline[0]).not.toHaveProperty("length");
    expect(
      (await collection.getMany({ view: "drafts" })).map(
        (entry) => entry.title,
      ),
    ).toEqual(["Draft"]);
    expect((await collection.getMany({ view: "descending" }))[0]?.title).toBe(
      "Long title",
    );
    expect(events.filter((event) => event.startsWith("augment:"))).toHaveLength(
      3,
    );
  });

  test("does not run listing callbacks for source reads, slug discovery, or CLI validation", async () => {
    await writeMd("draft.md", "Draft");
    const callback = vi.fn(() => {
      throw new Error("Listing callback must not run");
    });
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
      views: (view) => ({
        default: view({
          filter: callback,
          sort: callback,
        }),
        listing: view({ filter: callback, sort: callback }),
      }),
    });
    expect((await collection[QinoPrimitiveMarker].readOne("draft")).title).toBe(
      "Draft",
    );
    expect(await collection.getAllSlugs()).toEqual(["draft"]);
    expect(await collection[QinoPrimitiveMarker].readAll()).toHaveLength(1);
    await validateCollection(collection);
    expect(callback).not.toHaveBeenCalled();
  });

  test("getAllSlugs lists every file even when the default view filters entries out", async () => {
    await writeMd("draft.md", "Draft");
    await writeMd("published.md", "Published");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
      views: (view) => ({
        default: view({ filter: (entry) => entry.title != "Draft" }),
      }),
    });
    expect(await collection.getAllSlugs()).toEqual(["draft", "published"]);
    expect(
      (await collection.getMany()).map((entry) => entry._meta.slug),
    ).toEqual(["published"]);
    await expect(collection.getOne("draft")).rejects.toThrow(
      /excluded by view "default"/,
    );
  });

  test("keeps equal comparisons stable and leaves later reads unaffected", async () => {
    await writeMd("a.md", "A");
    await writeMd("b.md", "B");
    await writeMd("c.md", "C");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
      views: (view) => ({
        default: view({}),
        tied: view({ sort: () => 0 }),
        reverse: view({ sort: (a, b) => b.title.localeCompare(a.title) }),
      }),
    });
    const original = await collection.getMany();
    expect(await collection.getMany({ view: "tied" })).toEqual(original);
    expect(
      (await collection.getMany({ view: "reverse" })).map(
        (entry) => entry.title,
      ),
    ).toEqual(["C", "B", "A"]);
    expect(await collection.getMany()).toEqual(original);
  });

  test("handles empty and fully filtered collections without comparing entries", async () => {
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const filter = vi.fn(() => false);
    const sort = vi.fn(() => 0);
    const collection = qino.defineCollection({
      views: (view) => ({
        default: view({
          filter,
          sort,
        }),
      }),
      directory: "/posts",
      extension: ".md",
      schema: z.object({ markdown: z.string(), title: z.string() }),
    });
    expect(await collection.getMany()).toEqual([]);
    expect(filter).not.toHaveBeenCalled();
    await writeMd("draft.md", "Draft");
    expect(await collection.getMany()).toEqual([]);
    expect(filter).toHaveBeenCalledTimes(1);
    expect(sort).not.toHaveBeenCalled();
    await expect(collection.getOne("draft")).rejects.toThrow(
      'Entry "draft" in collection "/posts" is excluded by view "default".',
    );
  });

  test.each(["filter", "sort"] as const)(
    "propagates %s failures",
    async (callback) => {
      await writeMd("a.md", "A");
      await writeMd("b.md", "B");
      const failure = new Error(`${callback} failed`);
      const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
      const collection = qino.defineCollection({
        directory: "/posts",
        extension: ".md",
        schema: z.object({ markdown: z.string(), title: z.string() }),
        views: (view) => ({
          default: view({
            [callback]: () => {
              throw failure;
            },
          }),
        }),
      });
      await expect(collection.getMany()).rejects.toBe(failure);
      if (callback == "filter") {
        await expect(collection.getOne("a")).rejects.toBe(failure);
      }
    },
  );

  test.each([undefined, "highlight"] as const)(
    "getOne applies the %s view's filter after augment without sorting",
    async (view) => {
      await writeMd("highlighted.md", "Highlighted");
      await writeMd("ordinary.md", "Ordinary");
      const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
      const sort = vi.fn(() => {
        throw new Error("Single entries must not sort");
      });
      const collection = qino.defineCollection({
        directory: "/posts",
        extension: ".md",
        schema: z.object({ markdown: z.string(), title: z.string() }),
        views: (defineView) => ({
          default: defineView({
            augment: async (entry) => ({
              highlight: entry.title == "Highlighted",
            }),
            filter: (entry) => entry.highlight,
            sort,
          }),
          highlight: defineView({
            augment: async (entry) => ({
              highlight: entry.title == "Highlighted",
            }),
            filter: (entry) => entry.highlight,
            sort,
          }),
          all: defineView({}),
        }),
      });
      await expect(
        collection.getOne("highlighted", { view }),
      ).resolves.toMatchObject({ highlight: true });
      await expect(collection.getOne("ordinary", { view })).rejects.toThrow(
        `Entry "ordinary" in collection "/posts" is excluded by view "${view ?? "default"}".`,
      );
      await expect(
        collection.getOne("ordinary", { view: "all" }),
      ).resolves.toMatchObject({ title: "Ordinary" });
      expect(sort).not.toHaveBeenCalled();
    },
  );

  test("validates excluded content and rejects getter callbacks", async () => {
    await writeMd("invalid.md", "Invalid");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      views: (view) => ({
        default: view({
          filter: () => false,
        }),
      }),
      directory: "/posts",
      extension: ".md",
      schema: z.object({ missing: z.string() }),
    });
    await expect(collection.getMany()).rejects.toThrow(/Validation failed/);
    for (const options of [{ filter: () => true }, { sort: () => 0 }]) {
      await expect(collection.getMany(options as never)).rejects.toThrow(
        /Getter filter and sort are not supported/,
      );
    }
  });
});
