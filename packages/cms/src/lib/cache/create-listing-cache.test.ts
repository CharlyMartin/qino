import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import type { AugmentOutput, Awaitable } from "../../types/augment";

type Post = { title: string };
type PostAugment = (post: Post) => Awaitable<AugmentOutput>;

// Old enough to trust: a file edited within 2s is built again on every call.
const OLD = 1_000_000;

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-listing-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(relPath: string, data: unknown, seconds = OLD) {
  const filePath = nodePath.join(tmp, relPath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data));
  await fs.utimes(filePath, seconds, seconds);
}

async function writeImage(relPath: string, width: number, seconds = OLD) {
  const filePath = nodePath.join(tmp, relPath);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await sharp({
    create: { width, height: 8, channels: 3, background: "#000" },
  }).toFile(filePath);
  await fs.utimes(filePath, seconds, seconds);
}

// Relative to the content folder, with "/" on every platform.
function toContentPath(filePath: unknown) {
  return nodePath.relative(tmp, String(filePath)).split(nodePath.sep).join("/");
}

// The paths read through the file cache, relative to the content folder.
function spyOnReads() {
  const stat = vi.spyOn(fs, "stat");
  return () => stat.mock.calls.map(([filePath]) => toContentPath(filePath));
}

function makeQino(reuseListings = true) {
  return initQino({ contentFolder: tmp, mediaFolder: tmp, reuseListings });
}

function makeBlog(reuseListings = true) {
  const qino = makeQino(reuseListings);
  const teams = qino.defineCollection({
    directory: "teams",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const authors = qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: z.object({ name: z.string(), team: z.string().optional() }),
    relations: { team: teams },
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".json",
    schema: z.object({
      title: z.string(),
      author: z.string(),
      date: z.string().default("2026-01-01"),
      draft: z.boolean().default(false),
    }),
    relations: { author: authors },
    views: (view) => ({
      default: view({}),
      listing: view({
        filter: (post) => !post.draft,
        sort: (a, b) => b.date.localeCompare(a.date),
      }),
      deep: view({ resolveDepth: { author: 2 } }),
    }),
  });
  return { qino, posts, authors, teams };
}

async function writeBlog() {
  await write("teams/core.json", { name: "Core" });
  await write("authors/ada.json", { name: "Ada", team: "teams/core.json" });
  await write("authors/bob.json", { name: "Bob" });
  await write("posts/a.json", { title: "A", author: "authors/ada.json" });
  await write("posts/b.json", { title: "B", author: "authors/bob.json" });
  await write("posts/c.json", { title: "C", author: "authors/ada.json" });
}

describe("reuseListings", () => {
  test("off, builds every entry on every call", async () => {
    await writeBlog();
    const { posts } = makeBlog(false);
    await posts.getEntries();
    const reads = spyOnReads();

    await posts.getEntries();

    expect(reads()).toEqual(
      expect.arrayContaining(["posts/a.json", "posts/b.json", "posts/c.json"]),
    );
  });

  test("with nothing changed, reads and resolves no entry again", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    const first = await posts.getEntries();
    const reads = spyOnReads();

    const second = await posts.getEntries();

    expect(reads()).toEqual([]);
    expect(second).toEqual(first);
    expect(second[0]?.author).toBe(first[0]?.author);
  });

  test("stats each file once per call, however many entries share it", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    const statSync = vi.spyOn(fsSync, "statSync");

    await posts.getEntries();

    const checked = statSync.mock.calls.map(([filePath]) =>
      toContentPath(filePath),
    );
    expect(checked.sort()).toEqual([
      "authors/ada.json",
      "authors/bob.json",
      "posts/a.json",
      "posts/b.json",
      "posts/c.json",
    ]);
  });

  test("builds an edited entry again, and only that one", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    await write(
      "posts/b.json",
      { title: "B, edited", author: "authors/bob.json" },
      OLD + 10,
    );
    const reads = spyOnReads();

    const entries = await posts.getEntries();

    expect(entries.map((post) => post.title)).toEqual(["A", "B, edited", "C"]);
    expect(reads()).toEqual(["posts/b.json", "authors/bob.json"]);
  });

  test("builds again an entry read within 2s of its edit, until its mtime is old enough", async () => {
    // A fixed clock, so the first read is within 2s of the mtime however slow.
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    const seconds = Math.floor(now / 1_000);
    await write("authors/bob.json", { name: "Bob" });
    await write(
      "posts/a.json",
      { title: "Before", author: "authors/bob.json" },
      seconds,
    );
    const { posts } = makeBlog();
    expect((await posts.getEntries())[0]?.title).toBe("Before");

    // Same size, inode, and mtime: only the content says it changed.
    await write(
      "posts/a.json",
      { title: "After!", author: "authors/bob.json" },
      seconds,
    );
    clock.mockReturnValue(now + 3_000);

    expect((await posts.getEntries())[0]?.title).toBe("After!");
  });

  test("checks the version each read saw, not the file after the build", async () => {
    await write("people/ada.json", { name: "Ada" });
    await write("posts/a.json", { title: "A", author: "people/ada.json" });
    const replacement = nodePath.join(tmp, "ada-replacement.json");
    await fs.writeFile(replacement, JSON.stringify({ name: "Ada, replaced" }));
    await fs.utimes(replacement, OLD, OLD);
    const qino = makeQino();
    let replaced = false;
    const people = qino.defineCollection({
      directory: "people",
      extension: ".json",
      // Swaps in an older file right after the read, before the build ends.
      schema: z.object({ name: z.string() }).transform((person) => {
        if (!replaced) {
          replaced = true;
          fsSync.renameSync(replacement, nodePath.join(tmp, "people/ada.json"));
        }
        return person;
      }),
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".json",
      schema: z.object({ title: z.string(), author: z.string() }),
      relations: { author: people },
    });

    expect((await posts.getEntries())[0]?.author.name).toBe("Ada");
    expect((await posts.getEntries())[0]?.author.name).toBe("Ada, replaced");
  });

  test("adds and drops entries as their files come and go", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();

    await fs.rm(nodePath.join(tmp, "posts/b.json"));
    await write("posts/d.json", { title: "D", author: "authors/bob.json" });

    expect((await posts.getEntries()).map((post) => post.title)).toEqual([
      "A",
      "C",
      "D",
    ]);
  });

  test("builds again every entry that resolved an edited target, and no other", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    await write(
      "authors/ada.json",
      { name: "Ada L.", team: "teams/core.json" },
      OLD + 10,
    );
    const reads = spyOnReads();

    const entries = await posts.getEntries();

    expect(entries.map((post) => post.author.name)).toEqual([
      "Ada L.",
      "Bob",
      "Ada L.",
    ]);
    expect(
      reads()
        .filter((path) => path.startsWith("posts/"))
        .sort(),
    ).toEqual(["posts/a.json", "posts/c.json"]);
  });

  test("tracks a target's own targets only on the branches that resolve them", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    const deep = await posts.getEntries({ view: "deep" });
    expect(deep[0]?.author.team).toMatchObject({ name: "Core" });

    await write("teams/core.json", { name: "Core team" }, OLD + 10);
    const reads = spyOnReads();

    // The default view stops at the author, so the team is no dependency.
    await posts.getEntries();
    expect(reads()).toEqual([]);
    const edited = await posts.getEntries({ view: "deep" });
    expect(edited[0]?.author.team).toMatchObject({ name: "Core team" });
    expect(
      reads()
        .filter((path) => path.startsWith("posts/"))
        .sort(),
    ).toEqual(["posts/a.json", "posts/c.json"]);
  });

  test("keeps targets over one directory apart after a partial rebuild", async () => {
    await write("people/ada.json", { name: "Ada" });
    await write("posts/a.json", { title: "A", author: "people/ada.json" });
    await write("posts/b.json", { title: "B", author: "people/ada.json" });
    const qino = makeQino();
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
      extension: ".json",
      schema: z
        .object({ title: z.string(), author: z.string() })
        .transform((post) => ({ ...post, editor: post.author })),
      relations: { author: people, editor: loudPeople },
    });
    await posts.getEntries();
    await write(
      "posts/b.json",
      { title: "B!", author: "people/ada.json" },
      OLD + 10,
    );

    const entries = await posts.getEntries();

    expect(entries.map((post) => [post.author.name, post.editor.name])).toEqual(
      [
        ["Ada", "ADA"],
        ["Ada", "ADA"],
      ],
    );
  });

  test("throws once a target it resolved is deleted, as a fresh listing would", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();

    await fs.rm(nodePath.join(tmp, "authors/bob.json"));

    await expect(posts.getEntries()).rejects.toThrow(
      /"author" → authors\/bob.*posts[\\/]b\.json/,
    );
  });

  test("counts a stat error other than a missing file as a change", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    const statSync = fsSync.statSync;
    vi.spyOn(fsSync, "statSync").mockImplementation(((
      filePath: fsSync.PathLike,
      options?: fsSync.StatSyncOptions,
    ) => {
      if (String(filePath).endsWith("bob.json")) {
        throw Object.assign(new Error("EACCES"), { code: "EACCES" });
      }
      return statSync(filePath, options);
    }) as typeof fsSync.statSync);
    const reads = spyOnReads();

    await posts.getEntries();

    expect(reads().filter((path) => path.startsWith("posts/"))).toEqual([
      "posts/b.json",
    ]);
  });

  test("builds an entry again once its image is replaced", async () => {
    await writeImage("images/cover.png", 16);
    await write("posts/a.json", { title: "A", cover: "/images/cover.png" });
    const qino = makeQino();
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".json",
      schema: z.object({ title: z.string(), cover: z.string() }),
      media: { cover: { accepted: "image/png", maxSize: "1MB" } },
    });
    expect((await posts.getEntries())[0]?.cover.width).toBe(16);

    await writeImage("images/cover.png", 24, OLD + 10);

    expect((await posts.getEntries())[0]?.cover.width).toBe(24);
  });

  test("builds an entry again once a tree target's image changes, and resolves items", async () => {
    await writeImage("images/avatar.png", 16);
    await write("docs/guides/setup.json", {
      title: "Setup",
      icon: "/images/avatar.png",
    });
    await write("site.json", { name: "qino" });
    await write("posts/a.json", {
      title: "A",
      guide: "docs/guides/setup.json",
      site: "site.json",
    });
    const qino = makeQino();
    const docs = qino.defineTree({
      directory: "docs",
      extension: ".json",
      titleField: "title",
      schema: z.object({ title: z.string(), icon: z.string() }),
      media: { icon: { accepted: "image/png", maxSize: "1MB" } },
    });
    const site = qino.defineItem({
      file: "site.json",
      schema: z.object({ name: z.string() }),
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".json",
      schema: z.object({
        title: z.string(),
        guide: z.string(),
        site: z.string(),
      }),
      relations: { guide: docs, site },
    });
    const [first] = await posts.getEntries();
    expect(first?.guide.icon.width).toBe(16);
    expect(first?.site.name).toBe("qino");

    // One at a time, so each dependency has to be tracked on its own.
    await writeImage("images/avatar.png", 24, OLD + 10);
    const [second] = await posts.getEntries();
    expect(second?.guide.icon.width).toBe(24);
    expect(second?.site.name).toBe("qino");

    await write("site.json", { name: "qino!" }, OLD + 10);
    const [third] = await posts.getEntries();
    expect(third?.guide.icon.width).toBe(24);
    expect(third?.site.name).toBe("qino!");
  });

  test("moves an edited entry into and out of a filtered listing", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    const titles = async () =>
      (await posts.getEntries({ view: "listing" })).map((post) => post.title);
    expect(await titles()).toEqual(["A", "B", "C"]);

    await write(
      "posts/b.json",
      { title: "B", author: "authors/bob.json", draft: true },
      OLD + 10,
    );
    expect(await titles()).toEqual(["A", "C"]);

    await write(
      "posts/b.json",
      { title: "B", author: "authors/bob.json" },
      OLD + 20,
    );
    expect(await titles()).toEqual(["A", "B", "C"]);
  });

  test("moves an entry whose sort field changes, and puts ties in slug order", async () => {
    await writeBlog();
    await write("posts/a.json", {
      title: "A",
      author: "authors/ada.json",
      date: "2026-03-01",
    });
    await write("posts/b.json", {
      title: "B",
      author: "authors/bob.json",
      date: "2026-02-01",
    });
    await write("posts/c.json", {
      title: "C",
      author: "authors/ada.json",
      date: "2026-02-01",
    });
    const { posts } = makeBlog();
    const titles = async () =>
      (await posts.getEntries({ view: "listing" })).map((post) => post.title);
    expect(await titles()).toEqual(["A", "B", "C"]);

    await write(
      "posts/c.json",
      { title: "C", author: "authors/ada.json", date: "2026-04-01" },
      OLD + 10,
    );
    expect(await titles()).toEqual(["C", "A", "B"]);

    // Tied with B again: back after it, in slug order, as from a fresh listing.
    await write(
      "posts/c.json",
      { title: "C", author: "authors/ada.json", date: "2026-02-01" },
      OLD + 20,
    );
    expect(await titles()).toEqual(["A", "B", "C"]);
    expect(
      (await makeBlog().posts.getEntries({ view: "listing" })).map(
        (post) => post.title,
      ),
    ).toEqual(["A", "B", "C"]);
  });

  test("pages a sorted view from the reused listing", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries({ view: "listing" });
    const reads = spyOnReads();

    const page = await posts.getPaginatedEntries(2, {
      view: "listing",
      perPage: 2,
    });

    expect(page).toMatchObject({ page: 2, pageCount: 2, total: 3 });
    expect(page.entries.map((post) => post.title)).toEqual(["C"]);
    expect(reads()).toEqual([]);
  });

  describe("augment", () => {
    // For tests that don't read the fields augment adds.
    function makeAugmented(augment: PostAugment) {
      const qino = makeQino();
      return qino.defineCollection({
        directory: "posts",
        extension: ".json",
        schema: z.object({ title: z.string() }),
        views: (view) => ({ default: view({ augment: augment as never }) }),
      });
    }

    test("runs on every entry on every call, without reading them again", async () => {
      await write("posts/a.json", { title: "A" });
      await write("posts/b.json", { title: "B" });
      let calls = 0;
      const posts = makeQino().defineCollection({
        directory: "posts",
        extension: ".json",
        schema: z.object({ title: z.string() }),
        views: (view) => ({
          default: view({ augment: () => ({ call: ++calls }) }),
        }),
      });
      await posts.getEntries();
      const reads = spyOnReads();

      const entries = await posts.getEntries();

      expect(entries.map((post) => post.call)).toEqual([3, 4]);
      expect(reads()).toEqual([]);
    });

    test("rejects the call when it throws, and the next call reads nothing again", async () => {
      await write("posts/a.json", { title: "A" });
      let fail = false;
      const posts = makeAugmented(() => {
        if (fail) throw new Error("no summary");
        return {};
      });
      await posts.getEntries();

      fail = true;
      await expect(posts.getEntries()).rejects.toThrow(
        /augment failed: no summary/,
      );
      fail = false;
      const reads = spyOnReads();
      await posts.getEntries();
      expect(reads()).toEqual([]);
    });

    test("returns the same listing for a sync and an async augment", async () => {
      await write("posts/a.json", { title: "A" });
      const sync = makeAugmented(({ title }) => ({
        lower: title.toLowerCase(),
      }));
      const async = makeAugmented(async ({ title }) => ({
        lower: title.toLowerCase(),
      }));

      expect(await sync.getEntries()).toEqual(await async.getEntries());
    });
  });

  test("keeps writes to a returned entry out of later calls", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    const [first] = await posts.getEntries();
    if (first) first.title = "Changed";

    expect((await posts.getEntries())[0]?.title).toBe("A");
  });

  test("retries only the entry whose build failed", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    await posts.getEntries();
    await write("posts/b.json", { author: "authors/bob.json" }, OLD + 10);
    await expect(posts.getEntries()).rejects.toThrow(/Validation failed/);

    await write(
      "posts/b.json",
      { title: "B, fixed", author: "authors/bob.json" },
      OLD + 20,
    );
    const reads = spyOnReads();

    expect((await posts.getEntries()).map((post) => post.title)).toEqual([
      "A",
      "B, fixed",
      "C",
    ]);
    expect(reads().filter((path) => path.startsWith("posts/"))).toEqual([
      "posts/b.json",
    ]);
  });

  test.each([true, false])(
    "with reuseListings %s, reports a read error before a relation error",
    async (reuse) => {
      await write("authors/bob.json", { name: "Bob" });
      await write("posts/a.json", {
        title: "A",
        author: "authors/missing.json",
      });
      await write("posts/b.json", { author: "authors/bob.json" });
      const { posts } = makeBlog(reuse);

      await expect(posts.getEntries()).rejects.toThrow(
        /posts\/b\.json.*Validation failed|Validation failed.*b\.json/s,
      );
    },
  );

  test.each([true, false])(
    "with reuseListings %s, reports the first failure in slug order, not the first to settle",
    async (reuse) => {
      await write("posts/a.json", { title: "A" });
      await write("posts/b.json", { title: "B" });
      const qino = makeQino(reuse);
      const posts = qino.defineCollection({
        directory: "posts",
        extension: ".json",
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

      await expect(posts.getEntries()).rejects.toThrow(/A failed/);
    },
  );

  test("shares one run between concurrent calls", async () => {
    await writeBlog();
    const { posts } = makeBlog();
    const reads = spyOnReads();

    const [all, page] = await Promise.all([
      posts.getEntries({ view: "listing" }),
      posts.getPaginatedEntries(1, { view: "listing", perPage: 2 }),
    ]);

    expect(all).toHaveLength(3);
    expect(page.entries).toHaveLength(2);
    expect(reads().filter((path) => path == "posts/a.json")).toHaveLength(1);
  });
});
