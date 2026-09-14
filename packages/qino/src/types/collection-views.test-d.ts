import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const schema = z.object({ title: z.string(), author: z.string() });
const authors = qino.createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});

test("infers post-augment inputs independently for default and named views", async () => {
  const posts = qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema,
    relations: { author: authors },
    views: (view) => ({
      default: view({
        resolveRelations: true,
        augment: async (entry) => ({ label: entry.author.name }),
        filter: (entry) => {
          expectTypeOf(entry.label).toEqualTypeOf<string>();
          expectTypeOf(entry.author.name).toEqualTypeOf<string>();
          expectTypeOf(entry._meta.slug).toEqualTypeOf<string>();
          // @ts-expect-error Callback entries are readonly.
          entry.title = "replacement";
          return entry.label.length > 0;
        },
        sort: (a, b) => a.label.localeCompare(b.label),
      }),
      raw: view({
        augment: (entry) => ({ length: entry.author.length }),
        filter: (entry) => {
          expectTypeOf(entry.author).toEqualTypeOf<string>();
          expectTypeOf(entry.length).toEqualTypeOf<number>();
          // @ts-expect-error Default augment is not inherited.
          entry.label;
          return entry.length > 0;
        },
        sort: (a, b) => b.length - a.length,
      }),
      resolved: view({
        resolveRelations: 1,
        augment: async (entry) => ({ name: entry.author.name }),
        filter: (entry) => entry.name == entry.author.name,
        sort: (a, b) => a.name.localeCompare(b.name),
      }),
      plain: view({
        filter: (entry) => entry.title.length > 0,
        sort: (a, b) => a.author.localeCompare(b.author),
      }),
      empty: view({}),
    }),
  });
  expectTypeOf((await posts.getMany())[0].label).toEqualTypeOf<string>();
  expectTypeOf(
    (await posts.getMany({ view: "raw" }))[0].length,
  ).toEqualTypeOf<number>();
  expectTypeOf(
    (await posts.getMany({ view: "resolved" }))[0].name,
  ).toEqualTypeOf<string>();
  expectTypeOf(
    (await posts.getMany({ view: "empty" }))[0].author,
  ).toEqualTypeOf<string>();
  type Options = NonNullable<Parameters<typeof posts.getMany>[0]>;
  expectTypeOf<Options["view"]>().toEqualTypeOf<
    "default" | "raw" | "resolved" | "plain" | "empty" | undefined
  >();
  const options: { view?: "raw" } = {};
  const entry = await posts.getOne("hello", options);
  // @ts-expect-error An optional selection can return the default view.
  entry.length;
  // @ts-expect-error Callbacks can only be configured at creation.
  posts.getMany({ view: "raw", filter: () => true });
  // @ts-expect-error Callbacks can only be configured at creation.
  posts.getMany({ sort: () => 0 });
});

test("rejects missing default views and conflicting helper augmentation", () => {
  qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema,
    // @ts-expect-error Factories must declare a default view.
    views: (view) => ({ other: view({}) }),
  });
  qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema,
    // @ts-expect-error A factory must return valid view definitions even without the helper.
    views: () => ({ invalid: { filter: async () => true } }),
  });
  qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema,
    views: (view) => ({
      default: view({}),
      invalid: view({
        // @ts-expect-error Augmentation cannot overwrite schema fields.
        augment: () => ({ title: "replacement" }),
      }),
    }),
  });
});

test("requires synchronous boolean predicates and numeric comparators", () => {
  qino.createCollection({
    directory: "/posts",
    extension: ".json",
    schema,
    views: (view) => ({
      default: view({
        // @ts-expect-error A predicate must return boolean.
        filter: () => 1,
        // @ts-expect-error A comparator must return number.
        sort: () => "asc",
      }),
      invalid: view({
        // @ts-expect-error Async predicates are unsupported.
        filter: async () => true,
        // @ts-expect-error Async comparators are unsupported.
        sort: async () => 0,
      }),
    }),
  });
});

test("does not expose callbacks on trees or singletons", () => {
  qino.createTree({
    views: (view) => ({
      default: view({
        // @ts-expect-error Tree filtering is deferred.
        filter: () => true,
      }),
    }),
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
  });
  qino.createSingleton({
    views: (view) => ({
      default: view({
        // @ts-expect-error Singletons cannot sort.
        sort: () => 0,
      }),
    }),
    file: "/home.json",
    schema,
  });
  qino.createTree({
    directory: "/docs",
    extension: ".json",
    titleField: "title",
    schema,
    views: (view) => ({
      default: view({}),
      listing: view({
        // @ts-expect-error Tree views cannot filter.
        filter: () => true,
      }),
    }),
  });
  qino.createSingleton({
    file: "/home.json",
    schema,
    views: (view) => ({
      default: view({}),
      listing: view({
        // @ts-expect-error Singleton views cannot sort.
        sort: () => 0,
      }),
    }),
  });
});
