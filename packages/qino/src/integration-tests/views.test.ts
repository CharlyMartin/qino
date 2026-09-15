import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { collectTreeSlugs } from "../cli/build/collect-tree-slugs";
import { validateCollection } from "../cli/check/validate-collection";
import { validateItem } from "../cli/check/validate-item";
import { validateTree } from "../cli/check/validate-tree";
import { createQino } from "../runtime/qino/create-qino";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-views-"));
  await Promise.all(
    ["posts", "docs", "authors"].map((dir) => fs.mkdir(path.join(tmp, dir))),
  );
  await Promise.all([
    fs.writeFile(
      path.join(tmp, "posts/hello.json"),
      JSON.stringify({ title: "Hello", author: "/authors/alice.json" }),
    ),
    fs.writeFile(
      path.join(tmp, "posts/second.json"),
      JSON.stringify({ title: "Second", author: "/authors/alice.json" }),
    ),
    fs.writeFile(
      path.join(tmp, "docs/hello.json"),
      JSON.stringify({ title: "Hello", author: "/authors/alice.json" }),
    ),
    fs.writeFile(
      path.join(tmp, "home.json"),
      JSON.stringify({ title: "Hello", author: "/authors/alice.json" }),
    ),
    fs.writeFile(
      path.join(tmp, "authors/alice.json"),
      JSON.stringify({ name: "Alice", lead: "/senior.json" }),
    ),
    fs.writeFile(
      path.join(tmp, "senior.json"),
      JSON.stringify({ name: "Senior" }),
    ),
  ]);
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe.each(["collection", "tree", "item"])("%s target", (targetKind) => {
  describe.each([
    "collection one",
    "collection all",
    "tree",
    "item",
  ])("%s views", (kind) => {
    test("resolves before augmenting, keeps views independent, and bypasses target augments", async () => {
      const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
      const targetAugment = vi.fn(() => {
        throw new Error("Target augment must not execute");
      });
      const senior = qino.defineItem({
        file: "/senior.json",
        schema: z.object({ name: z.string() }),
        views: (view) => ({
          default: view({
            augment: targetAugment,
          }),
          broken: view({ augment: targetAugment }),
        }),
      });
      const authorConfigView = {
        resolveRelations: false,
        augment: targetAugment,
      };
      const authorConfig = {
        schema: z.object({ name: z.string(), lead: z.string() }),
        relations: { lead: senior },
      };
      const authors =
        targetKind == "tree"
          ? qino.defineTree({
              ...authorConfig,
              views: (view) => ({
                default: view({ ...authorConfigView }),
                broken: view({ augment: targetAugment }),
              }),
              directory: "/authors",
              extension: ".json",
              titleField: "name",
            })
          : targetKind == "item"
            ? qino.defineItem({
                ...authorConfig,
                views: (view) => ({
                  default: view({ ...authorConfigView }),
                  broken: view({ augment: targetAugment }),
                }),
                file: "/authors/alice.json",
              })
            : qino.defineCollection({
                ...authorConfig,
                views: (view) => ({
                  default: view({ ...authorConfigView }),
                  broken: view({ augment: targetAugment }),
                }),
                directory: "/authors",
                extension: ".json",
              });
      const defaultAugment = vi.fn((entry: { author: string }) => ({
        defaultSlug: entry.author,
      }));
      const rawAugment = vi.fn((entry: { author: string }) => ({
        slugLength: entry.author.length,
      }));
      const detailAugment = vi.fn(
        async (entry: {
          author: { name: string; lead: { name: string } };
        }) => ({
          label: `${entry.author.name} / ${entry.author.lead.name}`,
        }),
      );
      const configView = {
        augment: defaultAugment,
      };
      const config = {
        schema: z.object({ title: z.string(), author: z.string() }),
        relations: { author: () => authors },
      };
      const collection = qino.defineCollection({
        ...config,
        views: (view) => ({
          default: view({ ...configView }),
          raw: view({ augment: rawAugment }),
          shallow: view({ resolveRelations: 1 as const }),
          detail: view({
            resolveRelations: 2 as const,
            augment: detailAugment,
          }),
          baseline: view({}),
        }),
        directory: "/posts",
        extension: ".json",
      });
      const tree = qino.defineTree({
        ...config,
        views: (view) => ({
          default: view({ ...configView }),
          raw: view({ augment: rawAugment }),
          shallow: view({ resolveRelations: 1 as const }),
          detail: view({
            resolveRelations: 2 as const,
            augment: detailAugment,
          }),
          baseline: view({}),
        }),
        directory: "/docs",
        extension: ".json",
        titleField: "title",
      });
      const item = qino.defineItem({
        ...config,
        views: (view) => ({
          default: view({ ...configView }),
          raw: view({ augment: rawAugment }),
          shallow: view({ resolveRelations: 1 as const }),
          detail: view({
            resolveRelations: 2 as const,
            augment: detailAugment,
          }),
          baseline: view({}),
        }),
        file: "/home.json",
      });
      const readers = {
        "collection one": async (
          options?: NonNullable<Parameters<typeof collection.getMany>[0]>,
        ) => [await collection.getOne("hello", options)],
        "collection all": (
          options?: NonNullable<Parameters<typeof collection.getMany>[0]>,
        ) => collection.getMany(options),
        tree: async (
          options?: NonNullable<Parameters<typeof collection.getMany>[0]>,
        ) => [await tree.getEntry("hello", options)],
        item: async (
          options?: NonNullable<Parameters<typeof collection.getMany>[0]>,
        ) => [await item.getData(options)],
      };
      const read = readers[kind as keyof typeof readers];
      const defaultEntries = await read();
      expect(defaultEntries[0]).toMatchObject({
        author: "/authors/alice.json",
        defaultSlug: "/authors/alice.json",
      });
      const raw = await read({ view: "raw" });
      expect(raw[0]).toMatchObject({
        author: "/authors/alice.json",
        slugLength: 19,
      });
      expect(raw[0]).not.toHaveProperty("defaultSlug");
      const shallow = await read({ view: "shallow" });
      expect(shallow[0]).toMatchObject({
        author: { name: "Alice", lead: "/senior.json" },
      });
      const detail = await read({ view: "detail" });
      expect(detail[0]).toMatchObject({
        author: { lead: { name: "Senior" } },
        label: "Alice / Senior",
      });
      expect(detail[0]).not.toHaveProperty("defaultSlug");
      expect(detailAugment).toHaveBeenCalledTimes(detail.length);
      const baseline = await read({ view: "baseline" });
      expect(baseline[0]).toMatchObject({ author: "/authors/alice.json" });
      expect(baseline[0]).not.toHaveProperty("label");
      expect(baseline[0]).not.toHaveProperty("defaultSlug");
      expect(defaultAugment).toHaveBeenCalledTimes(defaultEntries.length);
      expect(rawAugment).toHaveBeenCalledTimes(raw.length);
      expect(targetAugment).not.toHaveBeenCalled();
      await read({ view: "detail" });
      expect(detailAugment).toHaveBeenCalledTimes(detail.length * 2);
      await expect(read({ view: "missing" } as never)).rejects.toThrow(
        /Unknown view/,
      );
      expect(await read({ view: "default" })).toEqual(defaultEntries);
      await expect(read({ resolveRelations: false } as never)).rejects.toThrow(
        /no longer supported/,
      );
      expect(await tree.getFlatTree()).toEqual([
        expect.objectContaining({
          slug: "hello",
          title: "Hello",
          children: [],
        }),
      ]);
      expect((await tree.getTree())[0]).not.toHaveProperty("defaultSlug");
    });
  });
});

test("default getters preserve references and run augment without loading targets", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.defineCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  await fs.unlink(path.join(tmp, "authors/alice.json"));
  const configView = {
    augment: (entry: { author: string }) => ({ reference: entry.author }),
  };
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
  };
  const collection = qino.defineCollection({
    views: (view) => ({ default: view({ ...configView }) }),
    ...config,
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.defineTree({
    views: (view) => ({ default: view({ ...configView }) }),
    ...config,
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const item = qino.defineItem({
    views: (view) => ({ default: view({ ...configView }) }),
    ...config,
    file: "/home.json",
  });
  for (const entry of [
    await collection.getOne("hello"),
    ...(await collection.getMany()),
    await tree.getEntry("hello"),
    await item.getData(),
  ]) {
    expect(entry).toMatchObject({
      author: "/authors/alice.json",
      reference: "/authors/alice.json",
    });
  }
});

test("collection listing callbacks receive resolved augmented entries and bypass target callbacks", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const targetFilter = vi.fn(() => false);
  const targetSort = vi.fn(() => {
    throw new Error("Target sort must not run");
  });
  const authors = qino.defineCollection({
    views: (view) => ({
      default: view({
        filter: targetFilter,
        sort: targetSort,
      }),
    }),
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const collection = qino.defineCollection({
    directory: "/posts",
    extension: ".json",
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    views: (view) => ({
      default: view({}),
      listing: view({
        resolveRelations: true,
        augment: async (entry) => ({
          label: `${entry.author.name}: ${entry.title}`,
        }),
        filter: (entry) =>
          entry.author.name == "Alice" && entry.label.endsWith("Hello"),
        sort: (a, b) => a.label.localeCompare(b.label),
      }),
    }),
  });
  expect(
    (await collection.getMany({ view: "listing" })).map((entry) => entry.label),
  ).toEqual(["Alice: Hello"]);
  expect(targetFilter).not.toHaveBeenCalled();
  expect(targetSort).not.toHaveBeenCalled();
  await expect(
    collection.getOne("hello", { view: "listing" }),
  ).resolves.toMatchObject({
    author: { name: "Alice" },
    label: "Alice: Hello",
  });
  await expect(
    collection.getOne("second", { view: "listing" }),
  ).rejects.toThrow(
    'Entry "second" in collection "/posts" is excluded by view "listing".',
  );
  expect(targetFilter).not.toHaveBeenCalled();
  expect(targetSort).not.toHaveBeenCalled();
  expect(await authors.getMany()).toEqual([]);
});

test("explicit resolution on the default runs before augmenting on every primitive", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.defineCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const configView = {
    resolveRelations: true as const,
    augment: (entry: { author: { name: string } }) => ({
      name: entry.author.name,
    }),
  };
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
  };
  const collection = qino.defineCollection({
    ...config,
    views: (view) => ({ default: view({ ...configView }), raw: view({}) }),
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.defineTree({
    ...config,
    views: (view) => ({ default: view({ ...configView }), raw: view({}) }),
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const item = qino.defineItem({
    ...config,
    views: (view) => ({ default: view({ ...configView }), raw: view({}) }),
    file: "/home.json",
  });
  for (const entry of [
    await collection.getOne("hello"),
    ...(await collection.getMany()),
    await tree.getEntry("hello"),
    await item.getData(),
  ]) {
    expect(entry).toMatchObject({ author: { name: "Alice" }, name: "Alice" });
  }
  for (const entry of [
    await collection.getOne("hello", { view: "raw" }),
    ...(await collection.getMany({ view: "raw" })),
    await tree.getEntry("hello", { view: "raw" }),
    await item.getData({ view: "raw" }),
  ]) {
    expect(entry.author).toBe("/authors/alice.json");
    expect(entry).not.toHaveProperty("name");
  }
});

test("CLI validation and slug generation skip views and relation resolution", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.defineCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const augment = vi.fn(() => {
    throw new Error("Should not run");
  });
  const configView = {
    resolveRelations: true as const,
    augment,
  };
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
  };
  const collection = qino.defineCollection({
    ...config,
    views: (view) => ({
      default: view({ ...configView }),
      broken: view({ augment }),
    }),
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.defineTree({
    ...config,
    views: (view) => ({
      default: view({ ...configView }),
      broken: view({ augment }),
    }),
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const item = qino.defineItem({
    ...config,
    views: (view) => ({
      default: view({ ...configView }),
      broken: view({ augment }),
    }),
    file: "/home.json",
  });
  await validateCollection(collection);
  await validateTree(tree);
  await validateItem(item);
  expect(await collection.getAllSlugs()).toEqual(["hello", "second"]);
  expect(await collectTreeSlugs(tree)).toEqual(["hello"]);
  expect(augment).not.toHaveBeenCalled();
  await fs.unlink(path.join(tmp, "authors/alice.json"));
  await expect(collection.getOne("hello")).rejects.toThrow(
    /Failed to resolve relation/,
  );
  await Promise.all([
    fs.writeFile(path.join(tmp, "posts/hello.json"), "{}"),
    fs.writeFile(path.join(tmp, "docs/hello.json"), "{}"),
    fs.writeFile(path.join(tmp, "home.json"), "{}"),
  ]);
  await expect(validateCollection(collection)).rejects.toThrow(
    /failed validation/,
  );
  await expect(validateTree(tree)).rejects.toThrow(/failed validation/);
  await expect(validateItem(item)).rejects.toThrow(/failed validation/);
});

test("view errors retain the source path and reject conflicting output at runtime", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const collection = qino.defineCollection({
    directory: "/posts",
    extension: ".json",
    schema: z.object({ title: z.string() }),
    views: (view) => ({
      default: view({}),
      failing: view({
        augment: async () => {
          throw new Error("callback failed");
        },
      }),
      conflict: view({ augment: (() => ({ title: "Replacement" })) as never }),
      invalid: view({ augment: (() => null) as never }),
    }),
  });
  await expect(collection.getOne("hello", { view: "failing" })).rejects.toThrow(
    /hello.json: augment failed: callback failed/,
  );
  await expect(
    collection.getOne("hello", { view: "conflict" }),
  ).rejects.toThrow(/hello.json: augment cannot overwrite.*title/);
  await expect(collection.getOne("hello", { view: "invalid" })).rejects.toThrow(
    /hello.json: augment must return an object/,
  );
  expect(() =>
    qino.defineItem({
      file: "/reserved.json",
      schema: z.object({}),
      views: (view) => ({ detail: view({}) }) as never,
    }),
  ).toThrow(/must return a "default" view/);
});

test.each([
  "collection",
  "tree",
  "item",
] as const)("%s validates optional views and root settings", async (kind) => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
  };
  const create = (options: object) => {
    if (kind == "collection")
      return qino.defineCollection({
        ...config,
        directory: "/posts",
        extension: ".json",
        ...options,
      });
    if (kind == "tree")
      return qino.defineTree({
        ...config,
        directory: "/docs",
        extension: ".json",
        titleField: "title",
        ...options,
      });
    return qino.defineItem({ ...config, file: "/home.json", ...options });
  };
  const baseline = create({});
  const read = (options?: never) => {
    if ("getOne" in baseline) return baseline.getOne("hello", options);
    if ("getEntry" in baseline) return baseline.getEntry("hello", options);
    return baseline.getData(options);
  };
  expect(await read()).toMatchObject({
    title: "Hello",
    author: "/authors/alice.json",
  });
  await expect(read({ view: "default" } as never)).rejects.toThrow(
    /Unknown view/,
  );
  for (const views of [() => ({}), () => ({ default: {} })]) {
    expect(() => create({ views })).toThrow(/default/);
  }
  for (const key of ["resolveRelations", "augment", "filter", "sort"]) {
    for (const options of [
      {},
      { views: (view: (config: object) => object) => ({ default: view({}) }) },
    ]) {
      expect(() => create({ ...options, [key]: () => true })).toThrow(
        `Configure "${key}" inside views.default`,
      );
      expect(() => create({ ...options, [key]: undefined })).not.toThrow();
    }
  }
});

test("spread reuse preserves default augmentation and sort while adding a custom filter", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".json",
    schema: z.object({ title: z.string() }),
    views: (view) => {
      const base = view({
        augment: (entry) => ({ length: entry.title.length }),
        sort: (a, b) => b.length - a.length,
      });
      return {
        default: base,
        highlight: view({ ...base, filter: (entry) => entry.length == 5 }),
        plain: view({}),
      };
    },
  });
  const defaults = await posts.getMany();
  expect(defaults.map((entry) => entry.title)).toEqual(["Second", "Hello"]);
  expect(await posts.getMany({ view: "default" })).toEqual(defaults);
  expect(
    (await posts.getMany({ view: "highlight" })).map((entry) => entry.title),
  ).toEqual(["Hello"]);
  expect((await posts.getOne("hello", { view: "highlight" })).length).toBe(5);
  await expect(posts.getOne("second", { view: "highlight" })).rejects.toThrow(
    /excluded by view "highlight"/,
  );
  expect(await posts.getOne("second", { view: "plain" })).not.toHaveProperty(
    "length",
  );
});
