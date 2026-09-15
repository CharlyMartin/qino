import { createQino, type Infer } from "qino";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const schema = z.object({
  title: z.string(),
  body: z.string(),
  highlight: z.boolean(),
});

test("spreads locally inferred views and selects the declared default", async () => {
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema,
    views: (view) => {
      const base = view({
        augment: async (article) => ({
          stats: { wordCount: article.body.length },
        }),
        sort: (a, b) => a.stats.wordCount - b.stats.wordCount,
      });
      return {
        default: base,
        highlight: view({
          ...base,
          filter: (a) => {
            expectTypeOf(a.stats.wordCount).toEqualTypeOf<number>();
            return a.highlight;
          },
        }),
        // No relations: changing depth preserves callback compatibility.
        deep: view({ ...base, resolveRelations: 2 }),
        plain: view({}),
      };
    },
  });
  const baseline = await posts.getOne("hello");
  const explicit = await posts.getOne("hello", { view: "default" });
  expectTypeOf(await posts.getMany({})).items.toEqualTypeOf(baseline);
  expectTypeOf(await posts.getMany(undefined)).items.toEqualTypeOf(baseline);
  expectTypeOf(await posts.getMany({ view: undefined })).items.toEqualTypeOf(
    baseline,
  );
  const highlight = await posts.getOne("hello", { view: "highlight" });
  expectTypeOf(explicit).toEqualTypeOf(baseline);
  expectTypeOf(highlight).toEqualTypeOf(baseline);
  expectTypeOf(await posts.getMany()).items.toEqualTypeOf(baseline);
  expectTypeOf(await posts.getMany({ view: "default" })).items.toEqualTypeOf(
    baseline,
  );
  expectTypeOf<Infer<typeof posts>["output"]>().toEqualTypeOf(baseline);
  expectTypeOf<Infer<typeof posts>["views"]["default"]>().toEqualTypeOf(
    baseline,
  );
  const optional = await posts.getOne("hello", {} as { view?: "plain" });
  const plain = await posts.getOne("hello", { view: "plain" });
  expectTypeOf(optional).toEqualTypeOf<typeof baseline | typeof plain>();
});

test("checks spread callbacks against changed relation shapes", () => {
  const senior = qino.defineItem({
    file: "/senior.json",
    schema: z.object({ name: z.string() }),
  });
  const authors = qino.defineCollection({
    directory: "/authors",
    extension: ".json",
    schema: z.object({ name: z.string(), lead: z.string() }),
    relations: { lead: senior },
  });
  qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema: schema.extend({ author: z.string() }),
    relations: { author: authors },
    views: (view) => {
      const base = view({
        resolveRelations: 1,
        augment: (entry) => ({ lead: entry.author.lead.toUpperCase() }),
      });
      // @ts-expect-error At depth two, lead is an object, incompatible with the inherited callback input.
      view({ ...base, resolveRelations: 2 });
      const listing = view({
        resolveRelations: 1,
        filter: (entry) => entry.author.lead.length > 0,
        sort: (a, b) => a.author.lead.localeCompare(b.author.lead),
      });
      // @ts-expect-error Filter and sort also require the original relation shape.
      view({ ...listing, resolveRelations: 2 });
      return {
        default: base,
        deep: view({
          ...base,
          resolveRelations: 2,
          filter: undefined,
          sort: undefined,
          augment: (entry) => ({ lead: entry.author.lead.name }),
        }),
      };
    },
  });
});

test("Collection requires default only when views exist", async () => {
  const plain = qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
  });
  expectTypeOf<keyof Infer<typeof plain>["views"]>().toEqualTypeOf<never>();
  // @ts-expect-error Without views, default is not a selectable name.
  plain.getOne("hello", { view: "default" });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error Empty factories have no default.
    views: () => ({}),
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error Custom views require a default sibling.
    views: (view) => ({ detail: view({}) }),
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error Default must use the helper.
    views: () => ({ default: {} }),
  });
  const configured = qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    views: (view) => ({
      default: view({ augment: (entry) => ({ label: entry.title }) }),
    }),
  });
  const implicit = await configured.getOne("hello");
  const explicit = await configured.getOne("hello", { view: "default" });
  expectTypeOf(explicit).toEqualTypeOf(implicit);
  expectTypeOf(implicit.label).toEqualTypeOf<string>();
  expectTypeOf<Infer<typeof configured>["output"]>().toEqualTypeOf(implicit);
  expectTypeOf<Infer<typeof configured>["views"]["default"]>().toEqualTypeOf(
    implicit,
  );
});

test("Collection rejects root resolveRelations with and without views", () => {
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    resolveRelations: true,
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    resolveRelations: true,
  });
});

test("Collection rejects root augment with and without views", () => {
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    augment: () => ({ derived: true }),
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    augment: () => ({ derived: true }),
  });
});

test("Collection rejects root filter with and without views", () => {
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    filter: () => true,
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    filter: () => true,
  });
});

test("Collection rejects root sort with and without views", () => {
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    sort: () => 0,
  });
  qino.defineCollection({
    directory: "/plain",
    extension: ".json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    sort: () => 0,
  });
});

test("Tree requires default only when views exist", async () => {
  const plain = qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
  });
  expectTypeOf<keyof Infer<typeof plain>["views"]>().toEqualTypeOf<never>();
  // @ts-expect-error Without views, default is not a selectable name.
  plain.getEntry("hello", { view: "default" });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error Empty factories have no default.
    views: () => ({}),
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error Custom views require a default sibling.
    views: (view) => ({ detail: view({}) }),
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error Default must use the helper.
    views: () => ({ default: {} }),
  });
  const configured = qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({
      default: view({ augment: (entry) => ({ label: entry.title }) }),
    }),
  });
  const implicit = await configured.getEntry("hello");
  expectTypeOf(await configured.getEntry("hello", {})).toEqualTypeOf(implicit);
  const explicit = await configured.getEntry("hello", { view: "default" });
  expectTypeOf(explicit).toEqualTypeOf(implicit);
  expectTypeOf(implicit.label).toEqualTypeOf<string>();
  expectTypeOf<Infer<typeof configured>["output"]>().toEqualTypeOf(implicit);
  expectTypeOf<Infer<typeof configured>["views"]["default"]>().toEqualTypeOf(
    implicit,
  );
});

test("Tree rejects root resolveRelations with and without views", () => {
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    resolveRelations: true,
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    resolveRelations: true,
  });
});

test("Tree rejects root augment with and without views", () => {
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    augment: () => ({ derived: true }),
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    augment: () => ({ derived: true }),
  });
});

test("Tree rejects root filter with and without views", () => {
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    filter: () => true,
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    filter: () => true,
  });
});

test("Tree rejects root sort with and without views", () => {
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    sort: () => 0,
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    sort: () => 0,
  });
});

test("Item requires default only when views exist", async () => {
  const plain = qino.defineItem({ file: "/home.json", schema });
  expectTypeOf<keyof Infer<typeof plain>["views"]>().toEqualTypeOf<never>();
  // @ts-expect-error Without views, default is not a selectable name.
  plain.getData({ view: "default" });
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error Empty factories have no default.
    views: () => ({}),
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error Custom views require a default sibling.
    views: (view) => ({ detail: view({}) }),
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error Default must use the helper.
    views: () => ({ default: {} }),
  });
  const configured = qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({
      default: view({ augment: (entry) => ({ label: entry.title }) }),
    }),
  });
  const implicit = await configured.getData();
  expectTypeOf(await configured.getData({})).toEqualTypeOf(implicit);
  const explicit = await configured.getData({ view: "default" });
  expectTypeOf(explicit).toEqualTypeOf(implicit);
  expectTypeOf(implicit.label).toEqualTypeOf<string>();
  expectTypeOf<Infer<typeof configured>["output"]>().toEqualTypeOf(implicit);
  expectTypeOf<Infer<typeof configured>["views"]["default"]>().toEqualTypeOf(
    implicit,
  );
});

test("Item rejects root resolveRelations with and without views", () => {
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    resolveRelations: true,
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    resolveRelations: true,
  });
});

test("Item rejects root augment with and without views", () => {
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    augment: () => ({ derived: true }),
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    augment: () => ({ derived: true }),
  });
});

test("Item rejects root filter with and without views", () => {
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    filter: () => true,
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    filter: () => true,
  });
});

test("Item rejects root sort with and without views", () => {
  qino.defineItem({
    file: "/home.json",
    schema,
    // @ts-expect-error View settings are forbidden at the root.
    sort: () => 0,
  });
  qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}) }),
    // @ts-expect-error Declaring views does not permit root settings.
    sort: () => 0,
  });
});
