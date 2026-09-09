import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const senior = qino.createSingleton({
  file: "/senior.json",
  schema: z.object({ name: z.string() }),
  augment: () => ({ privateDerived: true }),
});
const authors = qino.createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string(), lead: z.string() }),
  relations: { lead: () => senior },
  augment: () => ({ privateDerived: true }),
});
const schema = z.object({ title: z.string(), author: z.string() });

const posts = qino.createCollection({
  directory: "/posts",
  extension: ".json",
  schema,
  relations: { author: () => authors },
  resolveRelations: true,
  augment: (entry) => ({ defaultName: entry.author.name }),
  views: {
    raw: {
      resolveRelations: false,
      augment: (entry) => ({ slugLength: entry.author.length }),
    },
    shallow: {
      resolveRelations: 1,
      augment: (entry) => ({ leadSlug: entry.author.lead }),
    },
    detail: {
      resolveRelations: 2,
      augment: async (entry) => ({ leadName: entry.author.lead.name }),
    },
    empty: {},
    augmented: { augment: (entry) => ({ name: entry.author }) },
  },
});

const tree = qino.createTree({
  directory: "/docs",
  extension: ".md",
  titleField: "title",
  schema,
  relations: { author: authors },
  views: {
    raw: {
      augment: (entry) => ({ authorSlug: entry.author }),
    },
    detail: {
      resolveRelations: true,
      augment: (entry) => ({
        authorName: entry.author.name,
        source: entry._meta.slug,
      }),
    },
  },
});
const home = qino.createSingleton({
  file: "/home.json",
  schema,
  relations: { author: authors },
  augment: (entry) => ({ defaultSlug: entry.author }),
  views: {
    raw: {
      augment: (entry) => ({ authorSlug: entry.author }),
    },
    detail: {
      resolveRelations: true,
      augment: async (entry) => ({ authorName: entry.author.name }),
    },
  },
});

describe("views inference", () => {
  test("omitted top-level resolution gives every augment raw references", async () => {
    const collection = qino.createCollection({
      directory: "/raw-posts",
      extension: ".json",
      schema,
      relations: { author: authors },
      augment: (entry) => ({ authorSlug: entry.author.toUpperCase() }),
    });
    const docs = qino.createTree({
      directory: "/raw-docs",
      extension: ".json",
      titleField: "title",
      schema,
      relations: { author: authors },
      augment: (entry) => ({ authorSlug: entry.author.toUpperCase() }),
    });
    const page = qino.createSingleton({
      file: "/raw-home.json",
      schema,
      relations: { author: authors },
      augment: (entry) => ({ authorSlug: entry.author.toUpperCase() }),
    });
    expectTypeOf(
      (await collection.getOne("hello")).author,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await collection.getAll())[0].authorSlug,
    ).toEqualTypeOf<string>();
    expectTypeOf((await docs.getEntry("hello")).author).toEqualTypeOf<string>();
    expectTypeOf(
      (await docs.getEntry("hello")).authorSlug,
    ).toEqualTypeOf<string>();
    expectTypeOf((await page.getData()).author).toEqualTypeOf<string>();
    expectTypeOf((await page.getData()).authorSlug).toEqualTypeOf<string>();
  });

  test("infers callback inputs and selected outputs", async () => {
    expectTypeOf(
      (await posts.getOne("hello")).defaultName,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await posts.getOne("hello", { view: "raw" })).author,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await posts.getAll({ view: "raw" }))[0].slugLength,
    ).toEqualTypeOf<number>();
    expectTypeOf(
      (await posts.getOne("hello", { view: "shallow" })).leadSlug,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await posts.getOne("hello", { view: "detail" })).leadName,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await posts.getOne("hello", { view: "augmented" })).name,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await posts.getOne("hello", { view: "empty" })).author,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await tree.getEntry("hello", { view: "raw" })).authorSlug,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await tree.getEntry("hello", { view: "detail" })).source,
    ).toEqualTypeOf<string>();
    expectTypeOf((await home.getData()).defaultSlug).toEqualTypeOf<string>();
    expectTypeOf(
      (await home.getData({ view: "detail" })).authorName,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await home.getData({ view: "raw" })).authorSlug,
    ).toEqualTypeOf<string>();
  });

  test("keeps the exact view-name union for autocomplete", () => {
    type Options = NonNullable<Parameters<typeof posts.getAll>[0]>;
    expectTypeOf<Options["view"]>().toEqualTypeOf<
      "raw" | "shallow" | "detail" | "empty" | "augmented" | undefined
    >();
  });

  test("returns a union for a union of view names", async () => {
    const name = "" as "raw" | "detail";
    const value = await posts.getOne("hello", { view: name });
    if ("slugLength" in value)
      expectTypeOf(value.author).toEqualTypeOf<string>();
    if ("leadName" in value)
      expectTypeOf(value.leadName).toEqualTypeOf<string>();
  });

  test("includes the default when the selected name is optional", async () => {
    const options: { view?: "raw" } = {};
    const value = await posts.getOne("hello", options);
    const defaultEntry = await posts.getOne("hello");
    expectTypeOf(value.author).toEqualTypeOf<
      string | typeof defaultEntry.author
    >();
    // @ts-expect-error The optional selection can return the default view.
    value.slugLength;
  });

  test("includes the default when the entire options object is optional", async () => {
    const options = undefined as { view: "raw" } | undefined;
    const value = await posts.getOne("hello", options);
    // @ts-expect-error No options selects the default view.
    value.slugLength;
  });

  test("rejects invalid selections and does not leak derived fields", async () => {
    // @ts-expect-error Default is selected by omitting view.
    posts.getAll({ view: "default" });
    // @ts-expect-error Unknown view.
    posts.getOne("hello", { view: "missing" });
    // @ts-expect-error Per-call resolution has been removed.
    posts.getAll({ resolveRelations: false });
    // @ts-expect-error Selecting a view cannot override its fixed depth.
    posts.getAll({ view: "detail", resolveRelations: false });
    // @ts-expect-error Per-call resolution is also removed without views.
    authors.getOne("alice", { resolveRelations: false });
    // @ts-expect-error Tree view names are restricted.
    tree.getEntry("hello", { view: "missing" });
    // @ts-expect-error Singleton view names are restricted.
    home.getData({ view: "default" });
    const entry = await posts.getOne("hello", { view: "empty" });
    // @ts-expect-error Named views do not inherit the default augmentation.
    entry.defaultName;
    const resolved = await posts.getOne("hello", { view: "detail" });
    // @ts-expect-error Nested targets never include augmentation.
    resolved.author.privateDerived;
    // @ts-expect-error Nested singleton targets never include augmentation.
    resolved.author.lead.privateDerived;
    // @ts-expect-error Unselected views do not contribute fields.
    entry.leadName;
  });

  test("rejects reserved names and conflicting output fields", () => {
    qino.createCollection({
      directory: "/reserved",
      extension: ".json",
      schema,
      // @ts-expect-error Default cannot be configured in views.
      views: { default: {} },
    });
    qino.createCollection({
      directory: "/conflict",
      extension: ".json",
      schema,
      views: {
        invalid: {
          // @ts-expect-error Cannot overwrite schema fields.
          augment: () => ({ title: "replacement" }),
        },
      },
    });
  });
});
