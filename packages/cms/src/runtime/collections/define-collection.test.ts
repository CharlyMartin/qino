import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { validateCollection } from "../../cli/check/validate-collection";
import { QinoPrimitiveMarker } from "../../data/globals";
import { initQino } from "../qino/init-qino";

type Post = { title: string };
type PostWithAuthor = Post & { author: string };
type Author = { name: string };

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
      directory: "posts",
      schema: z.object({ title: z.string() }).strict(),
      extension: ".md",
    });

    await expect(collection.getEntry("hello")).resolves.toMatchObject({
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
    directory: "posts",
    schema: z.object({ title: z.string() }),
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
        directory: "posts",
        extension,
        schema: z.object({ title: z.string() }),
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
      directory: "posts",
      extension: ".json",
      schema: z.object({ title: z.string() }),
    });

    expect(await collection.getAllSlugs()).toEqual(["invalid", "malformed"]);
    await expect(collection.getEntry("malformed")).rejects.toThrow();
    await expect(collection.getEntry("invalid")).rejects.toThrow();
  });

  test("never reads content, validates schemas, resolves relations, or runs augment", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(
      nodePath.join(tmp, "posts/hello.json"),
      JSON.stringify({ title: "Hello", author: "authors/alice.json" }),
    );
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const authors = qino.defineCollection({
      directory: "authors",
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
      directory: "posts",
      extension: ".json",
      schema: z
        .object({ title: z.string(), author: z.string() })
        .superRefine(validate),
      relations: { author: relation },
      views: (view) => ({
        default: view({
          augment,
        }),
        detail: view({ augment }),
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
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => {
        created();
        return { default: view({}), listing: view({ filter: () => true }) };
      },
    });
    expect(created).toHaveBeenCalledTimes(1);
    await collection.getEntries({ view: "listing" });
    await collection.getEntries({ view: "listing" });
    expect(created).toHaveBeenCalledTimes(1);
    await expect(
      collection.getEntries({ view: "missing" } as never),
    ).rejects.toThrow(/Unknown view/);
    expect(() =>
      qino.defineCollection({
        directory: "posts",
        extension: ".md",
        schema: z.object({ title: z.string() }),
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
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
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
    expect((await collection.getEntries()).map((entry) => entry.title)).toEqual(
      ["Short", "Long title"],
    );
    const baseline = await collection.getEntries({ view: "baseline" });
    expect(baseline).toHaveLength(3);
    expect(baseline[0]).not.toHaveProperty("length");
    expect(
      (await collection.getEntries({ view: "drafts" })).map(
        (entry) => entry.title,
      ),
    ).toEqual(["Draft"]);
    expect(
      (await collection.getEntries({ view: "descending" }))[0]?.title,
    ).toBe("Long title");
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
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({
          filter: callback,
          sort: callback,
        }),
        listing: view({ filter: callback, sort: callback }),
      }),
    });
    expect(
      (await collection[QinoPrimitiveMarker].readEntry("draft")).title,
    ).toBe("Draft");
    expect(await collection.getAllSlugs()).toEqual(["draft"]);
    expect(await collection[QinoPrimitiveMarker].readEntries()).toHaveLength(1);
    await validateCollection(collection);
    expect(callback).not.toHaveBeenCalled();
  });

  test("getAllSlugs lists every file even when the default view filters entries out", async () => {
    await writeMd("draft.md", "Draft");
    await writeMd("published.md", "Published");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({ filter: (entry) => entry.title != "Draft" }),
      }),
    });
    expect(await collection.getAllSlugs()).toEqual(["draft", "published"]);
    expect(
      (await collection.getEntries()).map((entry) => entry._meta.slug),
    ).toEqual(["published"]);
    await expect(collection.getEntry("draft")).rejects.toThrow(
      /excluded by view "default"/,
    );
  });

  test("keeps equal comparisons stable and leaves later reads unaffected", async () => {
    await writeMd("a.md", "A");
    await writeMd("b.md", "B");
    await writeMd("c.md", "C");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({}),
        tied: view({ sort: () => 0 }),
        reverse: view({ sort: (a, b) => b.title.localeCompare(a.title) }),
      }),
    });
    const original = await collection.getEntries();
    expect(await collection.getEntries({ view: "tied" })).toEqual(original);
    expect(
      (await collection.getEntries({ view: "reverse" })).map(
        (entry) => entry.title,
      ),
    ).toEqual(["C", "B", "A"]);
    expect(await collection.getEntries()).toEqual(original);
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
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
    });
    expect(await collection.getEntries()).toEqual([]);
    expect(filter).not.toHaveBeenCalled();
    await writeMd("draft.md", "Draft");
    expect(await collection.getEntries()).toEqual([]);
    expect(filter).toHaveBeenCalledTimes(1);
    expect(sort).not.toHaveBeenCalled();
    await expect(collection.getEntry("draft")).rejects.toThrow(
      'Entry "draft" in collection "posts" is excluded by view "default".',
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
        directory: "posts",
        extension: ".md",
        schema: z.object({ title: z.string() }),
        views: (view) => ({
          default: view({
            [callback]: () => {
              throw failure;
            },
          }),
        }),
      });
      await expect(collection.getEntries()).rejects.toBe(failure);
      if (callback == "filter") {
        await expect(collection.getEntry("a")).rejects.toBe(failure);
      }
    },
  );

  test.each([undefined, "highlight"] as const)(
    "getEntry applies the %s view's filter after augment without sorting",
    async (view) => {
      await writeMd("highlighted.md", "Highlighted");
      await writeMd("ordinary.md", "Ordinary");
      const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
      const sort = vi.fn(() => {
        throw new Error("Single entries must not sort");
      });
      const collection = qino.defineCollection({
        directory: "posts",
        extension: ".md",
        schema: z.object({ title: z.string() }),
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
        collection.getEntry("highlighted", { view }),
      ).resolves.toMatchObject({ highlight: true });
      await expect(collection.getEntry("ordinary", { view })).rejects.toThrow(
        `Entry "ordinary" in collection "posts" is excluded by view "${view ?? "default"}".`,
      );
      await expect(
        collection.getEntry("ordinary", { view: "all" }),
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
      directory: "posts",
      extension: ".md",
      schema: z.object({ missing: z.string() }),
    });
    await expect(collection.getEntries()).rejects.toThrow(/Validation failed/);
    for (const options of [{ filter: () => true }, { sort: () => 0 }]) {
      await expect(collection.getEntries(options as never)).rejects.toThrow(
        /Getter filter and sort are not supported/,
      );
    }
  });
});

describe("getPaginatedEntries", () => {
  function makePagedCollection(augment = vi.fn(() => ({}))) {
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    return qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({ augment }),
        listing: view({
          augment: (entry) => ({ draft: entry.title.startsWith("Draft") }),
          filter: (entry) => !entry.draft,
          sort: (a, b) => b.title.localeCompare(a.title),
        }),
      }),
    });
  }

  test("pages a sorted, filtered view and counts entries after the filter", async () => {
    for (const title of ["A", "B", "Draft one", "C", "D", "E"]) {
      await writeMd(`${title.toLowerCase().replace(" ", "-")}.md`, title);
    }
    const collection = makePagedCollection();

    const first = await collection.getPaginatedEntries(1, {
      view: "listing",
      perPage: 2,
    });
    expect(first.entries.map((entry) => entry.title)).toEqual(["E", "D"]);
    expect(first).toMatchObject({
      page: 1,
      perPage: 2,
      pageCount: 3,
      total: 5,
    });
    expect(first.entries[0]?.draft).toBe(false);
    const last = await collection.getPaginatedEntries(3, {
      view: "listing",
      perPage: 2,
    });
    expect(last.entries.map((entry) => entry.title)).toEqual(["A"]);
  });

  test("pages an unsorted view in slug order, reading only that page's files", async () => {
    for (const slug of ["d", "b", "e", "a", "c"]) {
      await writeMd(`${slug}.md`, slug.toUpperCase());
    }
    const augment = vi.fn(() => ({}));
    const collection = makePagedCollection(augment);
    const readFile = vi.spyOn(fs, "readFile");

    const result = await collection.getPaginatedEntries(2, { perPage: 2 });

    expect(result.entries.map((entry) => entry._meta.slug)).toEqual(["c", "d"]);
    expect(result).toMatchObject({ page: 2, pageCount: 3, total: 5 });
    expect(augment).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  test("only validates the files on the requested page of an unsorted view", async () => {
    await writeMd("a.md", "A");
    await fs.writeFile(nodePath.join(tmp, "posts", "b.md"), "---\n---\n");
    const collection = makePagedCollection();

    await expect(
      collection.getPaginatedEntries(1, { perPage: 1 }),
    ).resolves.toMatchObject({ total: 2 });
    await expect(
      collection.getPaginatedEntries(2, { perPage: 1 }),
    ).rejects.toThrow(/Validation failed/);
  });

  test("throws the first read failure in slug order on a page of an unsorted view", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(nodePath.join(tmp, "posts", "a.md"), "---\n---\n");
    await fs.writeFile(nodePath.join(tmp, "posts", "b.md"), "---\n---\n");
    const readFile = fs.readFile;
    vi.spyOn(fs, "readFile").mockImplementation(
      async (...args: Parameters<typeof fs.readFile>) => {
        // a.md fails last, so only slug order makes its error win.
        if (String(args[0]).endsWith("a.md")) {
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        return readFile(...args);
      },
    );

    await expect(
      makePagedCollection().getPaginatedEntries(1, { perPage: 2 }),
    ).rejects.toThrow(/a\.md/);
  });

  test("throws the first augment failure in slug order on a page of an unsorted view", async () => {
    await writeMd("a.md", "A");
    await writeMd("b.md", "B");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({
          augment: async ({ title }) => {
            await new Promise((resolve) =>
              setTimeout(resolve, title == "A" ? 20 : 0),
            );
            throw new Error(`${title} failed`);
          },
        }),
      }),
    });

    await expect(
      collection.getPaginatedEntries(1, { perPage: 2 }),
    ).rejects.toThrow(/A failed/);
  });

  test("returns an empty first page for an empty or missing directory", async () => {
    const collection = makePagedCollection();
    const empty = { entries: [], page: 1, perPage: 10, pageCount: 1, total: 0 };

    expect(await collection.getPaginatedEntries(1, { perPage: 10 })).toEqual(
      empty,
    );
    await fs.mkdir(nodePath.join(tmp, "posts"));
    expect(
      await collection.getPaginatedEntries(1, {
        view: "listing",
        perPage: 10,
      }),
    ).toEqual(empty);
  });

  test("rejects a bad page or perPage before reading any entry", async () => {
    await writeMd("a.md", "A");
    await fs.writeFile(nodePath.join(tmp, "posts", "b.md"), "---\n---\n");
    const augment = vi.fn(() => ({}));
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({
          augment,
          sort: (a, b) => a.title.localeCompare(b.title),
        }),
      }),
    });
    const readFile = vi.spyOn(fs, "readFile");

    await expect(
      collection.getPaginatedEntries(0, { perPage: 2 }),
    ).rejects.toThrow(/page must be a positive integer, got 0/);
    await expect(
      collection.getPaginatedEntries(1, { perPage: 0 }),
    ).rejects.toThrow(/perPage must be a positive integer, got 0/);
    expect(readFile).not.toHaveBeenCalled();
    expect(augment).not.toHaveBeenCalled();
  });

  test("rejects out-of-range pages, invalid sizes, unknown views, and getter callbacks", async () => {
    await writeMd("a.md", "A");
    await writeMd("b.md", "B");
    const collection = makePagedCollection();

    await expect(
      collection.getPaginatedEntries(2, { view: "listing", perPage: 2 }),
    ).rejects.toThrow(
      'Collection "posts" (view "listing"): page 2 is out of range, expected 1 to 1.',
    );
    await expect(
      collection.getPaginatedEntries(0, { perPage: 2 }),
    ).rejects.toThrow(
      'Collection "posts" (view "default"): page must be a positive integer, got 0.',
    );
    await expect(
      collection.getPaginatedEntries(1, { perPage: 0 }),
    ).rejects.toThrow(/perPage must be a positive integer, got 0/);
    await expect(
      collection.getPaginatedEntries(1, undefined as never),
    ).rejects.toThrow(/perPage must be a positive integer, got undefined/);
    await expect(
      collection.getPaginatedEntries(1, {
        view: "missing",
        perPage: 2,
      } as never),
    ).rejects.toThrow(/Unknown view "missing"/);
    await expect(
      collection.getPaginatedEntries(1, {
        perPage: 2,
        sort: () => 0,
      } as never),
    ).rejects.toThrow(/Getter filter and sort are not supported/);
  });
});

describe("collection read cache", () => {
  async function touch(relPath: string, seconds: number) {
    const filePath = nodePath.join(tmp, relPath);
    await fs.utimes(filePath, seconds, seconds);
  }

  test("reuses parsed files between calls, relation targets included", async () => {
    await fs.mkdir(nodePath.join(tmp, "authors"));
    await fs.writeFile(
      nodePath.join(tmp, "authors/ada.json"),
      JSON.stringify({ name: "Ada" }),
    );
    await writeMd("a.md", "A");
    await writeMd("b.md", "B");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const parseAuthor = vi.fn((author: Author) => author);
    const parsePost = vi.fn((post: PostWithAuthor) => post);
    const authors = qino.defineCollection({
      directory: "authors",
      extension: ".json",
      schema: z.object({ name: z.string() }).transform(parseAuthor),
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z
        .object({
          title: z.string(),
          author: z.string().default("authors/ada.json"),
        })
        .transform(parsePost),
      relations: { author: authors },
    });

    await posts.getEntries();
    const second = await posts.getEntries();

    expect(parsePost).toHaveBeenCalledTimes(2);
    expect(parseAuthor).toHaveBeenCalledTimes(1);
    expect(second.map((post) => post.author.name)).toEqual(["Ada", "Ada"]);
  });

  test("re-reads a file once it changes", async () => {
    await writeMd("a.md", "Before");
    await touch("posts/a.md", 1_000);
    const collection = makeCollection();
    expect((await collection.getEntry("a")).title).toBe("Before");

    await writeMd("a.md", "After!");
    await touch("posts/a.md", 2_000);

    expect((await collection.getEntry("a")).title).toBe("After!");
    expect((await collection.getEntries()).map((post) => post.title)).toEqual([
      "After!",
    ]);
  });

  test("re-reads a just-edited file whose rewrite keeps its size and mtime", async () => {
    const seconds = Math.floor(Date.now() / 1_000);
    await writeMd("a.md", "Before");
    await touch("posts/a.md", seconds);
    const collection = makeCollection();
    expect((await collection.getEntry("a")).title).toBe("Before");

    await writeMd("a.md", "After!");
    await touch("posts/a.md", seconds);

    expect((await collection.getEntry("a")).title).toBe("After!");
  });

  test("does not cache a file that fails validation", async () => {
    await fs.mkdir(nodePath.join(tmp, "posts"));
    await fs.writeFile(nodePath.join(tmp, "posts/a.md"), "---\n---\n");
    await touch("posts/a.md", 1_000);
    const collection = makeCollection();
    await expect(collection.getEntry("a")).rejects.toThrow(/Validation failed/);

    await writeMd("a.md", "Fixed");
    await touch("posts/a.md", 2_000);

    expect((await collection.getEntry("a")).title).toBe("Fixed");
  });

  test("drops a removed file once a listing no longer finds it", async () => {
    await writeMd("a.md", "A");
    await touch("posts/a.md", 1_000);
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const parse = vi.fn((post: Post) => post);
    const collection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }).transform(parse),
    });
    await collection.getEntry("a");
    const postPath = nodePath.join(tmp, "posts/a.md");
    const awayPath = nodePath.join(tmp, "a.md");

    // Moving it away and back keeps its inode, mtime, and size.
    await fs.rename(postPath, awayPath);
    expect(await collection.getAllSlugs()).toEqual([]);
    await fs.rename(awayPath, postPath);

    await collection.getEntry("a");
    expect(parse).toHaveBeenCalledTimes(2);
  });

  test("keeps top-level writes to a returned entry out of later reads", async () => {
    await writeMd("a.md", "Original");
    const collection = makeCollection();

    const entry = await collection.getEntry("a");
    entry.title = "Changed";

    expect((await collection.getEntry("a")).title).toBe("Original");
  });

  test("keeps collections over the same directory apart", async () => {
    await writeMd("a.md", "Hello");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const plain = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
    });
    const loud = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z
        .object({ title: z.string() })
        .transform(({ title }) => ({ title: title.toUpperCase() })),
    });

    expect((await plain.getEntry("a")).title).toBe("Hello");
    expect((await loud.getEntry("a")).title).toBe("HELLO");
  });

  test("keeps relation targets over the same directory apart", async () => {
    await fs.mkdir(nodePath.join(tmp, "people"));
    await fs.writeFile(
      nodePath.join(tmp, "people/ada.json"),
      JSON.stringify({ name: "Ada" }),
    );
    await writeMd("a.md", "A");
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    const people = qino.defineCollection({
      directory: "people",
      extension: ".json",
      schema: z.object({ name: z.string() }),
    });
    const loudPeople = qino.defineCollection({
      directory: "people",
      extension: ".json",
      schema: z
        .object({ name: z.string() })
        .transform(({ name }) => ({ name: name.toUpperCase() })),
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({
        title: z.string(),
        author: z.string().default("people/ada.json"),
        editor: z.string().default("people/ada.json"),
      }),
      relations: { author: people, editor: loudPeople },
    });

    const [post] = await posts.getEntries();

    expect(post?.author.name).toBe("Ada");
    expect(post?.editor.name).toBe("ADA");
  });
});

describe("getEntries order", () => {
  test("returns unsorted views in slug order", async () => {
    for (const slug of ["c", "a-b", "b", "a"]) {
      await writeMd(`${slug}.md`, slug);
    }

    expect(
      (await makeCollection().getEntries()).map((post) => post._meta.slug),
    ).toEqual(["a", "a-b", "b", "c"]);
  });
});

describe("concurrent reads", () => {
  function makeListedCollection(augment = vi.fn(() => ({}))) {
    const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
    return qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      views: (view) => ({
        default: view({}),
        listing: view({
          augment,
          sort: (a, b) => b.title.localeCompare(a.title),
        }),
      }),
    });
  }

  test("share one listing per view, across getEntries and getPaginatedEntries", async () => {
    for (const slug of ["a", "b", "c"]) await writeMd(`${slug}.md`, slug);
    const augment = vi.fn(() => ({}));
    const collection = makeListedCollection(augment);

    const [all, first, second] = await Promise.all([
      collection.getEntries({ view: "listing" }),
      collection.getPaginatedEntries(1, { view: "listing", perPage: 2 }),
      collection.getPaginatedEntries(2, { view: "listing", perPage: 2 }),
    ]);

    expect(augment).toHaveBeenCalledTimes(3);
    expect(all.map((post) => post.title)).toEqual(["c", "b", "a"]);
    expect(first.entries.map((post) => post.title)).toEqual(["c", "b"]);
    expect(second.entries.map((post) => post.title)).toEqual(["a"]);
  });

  test("share a listing without configured views, each caller with its own array", async () => {
    for (const slug of ["a", "b"]) await writeMd(`${slug}.md`, slug);
    const collection = makeCollection();

    const [first, second] = await Promise.all([
      collection.getEntries(),
      collection.getEntries(),
    ]);
    first.reverse();

    expect(second[0]).toEqual(first[1]);
    expect(second.map((post) => post.title)).toEqual(["a", "b"]);
  });

  test("give each caller its own entries, so top-level writes stay in that call", async () => {
    for (const slug of ["a", "b", "c"]) await writeMd(`${slug}.md`, slug);
    const collection = makeListedCollection();

    const [all, again, page] = await Promise.all([
      collection.getEntries({ view: "listing" }),
      collection.getEntries({ view: "listing" }),
      collection.getPaginatedEntries(1, { view: "listing", perPage: 2 }),
    ]);
    const [first] = all;
    if (first) first.title = "Changed by another page";

    expect(again.map((post) => post.title)).toEqual(["c", "b", "a"]);
    expect(page.entries.map((post) => post.title)).toEqual(["c", "b"]);
  });

  test("give pages their own entries, so top-level writes stay in that call", async () => {
    for (const slug of ["a", "b", "c"]) await writeMd(`${slug}.md`, slug);
    const collection = makeListedCollection();

    const [first, again, all] = await Promise.all([
      collection.getPaginatedEntries(1, { view: "listing", perPage: 2 }),
      collection.getPaginatedEntries(1, { view: "listing", perPage: 2 }),
      collection.getEntries({ view: "listing" }),
    ]);
    const [entry] = first.entries;
    if (entry) entry.title = "Changed by another page";

    expect(again.entries.map((post) => post.title)).toEqual(["c", "b"]);
    expect(all.map((post) => post.title)).toEqual(["c", "b", "a"]);
  });

  test("keep different views apart", async () => {
    for (const slug of ["a", "b"]) await writeMd(`${slug}.md`, slug);
    const collection = makeListedCollection();

    const [plain, listed] = await Promise.all([
      collection.getEntries(),
      collection.getEntries({ view: "listing" }),
    ]);

    expect(plain.map((post) => post.title)).toEqual(["a", "b"]);
    expect(listed.map((post) => post.title)).toEqual(["b", "a"]);
  });

  test("start a new listing for a call after the previous one finished", async () => {
    for (const slug of ["a", "b"]) await writeMd(`${slug}.md`, slug);
    const augment = vi.fn(() => ({}));
    const collection = makeListedCollection(augment);

    const first = await collection.getEntries({ view: "listing" });
    const second = await collection.getEntries({ view: "listing" });

    expect(augment).toHaveBeenCalledTimes(4);
    expect(second[0]).not.toBe(first[0]);
  });
});
