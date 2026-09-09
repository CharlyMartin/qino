import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { collectTreeSlugs } from "../cli/build/collect-tree-slugs";
import { validateCollection } from "../cli/check/validate-collection";
import { validateSingleton } from "../cli/check/validate-singleton";
import { validateTree } from "../cli/check/validate-tree";
import type { GetterOptions } from "../types";
import { createQino } from "./qino/create-qino";

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

describe.each([
  "collection one",
  "collection all",
  "tree",
  "singleton",
])("%s views", (kind) => {
  test("resolves before augmenting, keeps views independent, and bypasses target augments", async () => {
    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const targetAugment = vi.fn(() => {
      throw new Error("Target augment must not execute");
    });
    const senior = qino.createSingleton({
      file: "/senior.json",
      schema: z.object({ name: z.string() }),
      augment: targetAugment,
      views: { broken: { augment: targetAugment } },
    });
    const authors = qino.createCollection({
      directory: "/authors",
      extension: ".json",
      schema: z.object({ name: z.string(), lead: z.string() }),
      relations: { lead: senior },
      resolveRelations: false,
      augment: targetAugment,
      views: { broken: { augment: targetAugment } },
    });
    const defaultAugment = vi.fn((entry: { author: string }) => ({
      defaultSlug: entry.author,
    }));
    const rawAugment = vi.fn((entry: { author: string }) => ({
      slugLength: entry.author.length,
    }));
    const detailAugment = vi.fn(
      async (entry: { author: { name: string; lead: { name: string } } }) => ({
        label: `${entry.author.name} / ${entry.author.lead.name}`,
      }),
    );
    const config = {
      schema: z.object({ title: z.string(), author: z.string() }),
      relations: { author: () => authors },
      augment: defaultAugment,
      views: {
        raw: { augment: rawAugment },
        shallow: { resolveRelations: 1 as const },
        detail: { resolveRelations: 2 as const, augment: detailAugment },
        baseline: {},
      },
    };
    const collection = qino.createCollection({
      ...config,
      directory: "/posts",
      extension: ".json",
    });
    const tree = qino.createTree({
      ...config,
      directory: "/docs",
      extension: ".json",
      titleField: "title",
    });
    const singleton = qino.createSingleton({ ...config, file: "/home.json" });
    const readers = {
      "collection one": async (
        options?: GetterOptions<keyof typeof config.views>,
      ) => [await collection.getOne("hello", options)],
      "collection all": (options?: GetterOptions<keyof typeof config.views>) =>
        collection.getAll(options),
      tree: async (options?: GetterOptions<keyof typeof config.views>) => [
        await tree.getEntry("hello", options),
      ],
      singleton: async (options?: GetterOptions<keyof typeof config.views>) => [
        await singleton.getData(options),
      ],
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
    await expect(read({ view: "default" } as never)).rejects.toThrow(
      /implicit/,
    );
    await expect(read({ resolveRelations: false } as never)).rejects.toThrow(
      /no longer supported/,
    );
    expect(await tree.getFlatTree()).toEqual([
      expect.objectContaining({ slug: "hello", title: "Hello", children: [] }),
    ]);
    expect((await tree.getTree())[0]).not.toHaveProperty("defaultSlug");
  });
});

test("default getters preserve references and run augment without loading targets", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.createCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  await fs.unlink(path.join(tmp, "authors/alice.json"));
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    augment: (entry: { author: string }) => ({ reference: entry.author }),
  };
  const collection = qino.createCollection({
    ...config,
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.createTree({
    ...config,
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const singleton = qino.createSingleton({ ...config, file: "/home.json" });
  for (const entry of [
    await collection.getOne("hello"),
    ...(await collection.getAll()),
    await tree.getEntry("hello"),
    await singleton.getData(),
  ]) {
    expect(entry).toMatchObject({
      author: "/authors/alice.json",
      reference: "/authors/alice.json",
    });
  }
});

test("explicit resolution on the default runs before augmenting on every primitive", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.createCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    resolveRelations: true as const,
    augment: (entry: { author: { name: string } }) => ({
      name: entry.author.name,
    }),
    views: { raw: {} },
  };
  const collection = qino.createCollection({
    ...config,
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.createTree({
    ...config,
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const singleton = qino.createSingleton({ ...config, file: "/home.json" });
  for (const entry of [
    await collection.getOne("hello"),
    ...(await collection.getAll()),
    await tree.getEntry("hello"),
    await singleton.getData(),
  ]) {
    expect(entry).toMatchObject({ author: { name: "Alice" }, name: "Alice" });
  }
  for (const entry of [
    await collection.getOne("hello", { view: "raw" }),
    ...(await collection.getAll({ view: "raw" })),
    await tree.getEntry("hello", { view: "raw" }),
    await singleton.getData({ view: "raw" }),
  ]) {
    expect(entry.author).toBe("/authors/alice.json");
    expect(entry).not.toHaveProperty("name");
  }
});

test("CLI validation and slug generation skip views and relation resolution", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.createCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string() }),
  });
  const augment = vi.fn(() => {
    throw new Error("Should not run");
  });
  const config = {
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    resolveRelations: true as const,
    augment,
    views: { broken: { augment } },
  };
  const collection = qino.createCollection({
    ...config,
    directory: "/posts",
    extension: ".json",
  });
  const tree = qino.createTree({
    ...config,
    directory: "/docs",
    extension: ".json",
    titleField: "title",
  });
  const singleton = qino.createSingleton({ ...config, file: "/home.json" });
  await validateCollection(collection);
  await validateTree(tree);
  await validateSingleton(singleton);
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
  await expect(validateSingleton(singleton)).rejects.toThrow(
    /failed validation/,
  );
});

test("view errors retain the source path and reject conflicting output at runtime", async () => {
  const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
  const collection = qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema: z.object({ title: z.string() }),
    views: {
      failing: {
        augment: async () => {
          throw new Error("callback failed");
        },
      },
      conflict: { augment: (() => ({ title: "Replacement" })) as never },
      invalid: { augment: (() => null) as never },
    },
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
    qino.createSingleton({
      file: "/reserved.json",
      schema: z.object({}),
      views: { default: {} } as never,
    }),
  ).toThrow(/reserved/);
});
