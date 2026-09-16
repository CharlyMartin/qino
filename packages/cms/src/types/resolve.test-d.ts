import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";
import type { TreeEntryMeta } from "./tree";

const { defineCollection, defineItem, defineTree } = createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const AuthorSchema = z
  .object({
    name: z.string(),
  })
  .strict();

const CategorySchema = z
  .object({
    name: z.string(),
  })
  .strict();

const PostSchema = z
  .object({
    title: z.string(),
    author: z.string(),
    categories: z.array(z.string()),
  })
  .strict();

const authorCollection = defineCollection({
  directory: "/authors",
  schema: AuthorSchema,
  extension: ".json",
});

const categoryCollection = defineCollection({
  directory: "/categories",
  schema: CategorySchema,
  extension: ".json",
});

const postCollection = defineCollection({
  views: (view) => ({
    default: view({}),
    raw: view({ resolveRelations: false }),
    shallow: view({ resolveRelations: 1 }),
    deep: view({ resolveRelations: 2 }),
    full: view({ resolveRelations: true }),
  }),
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
  },
});

describe("non-relation subtrees are left untouched", () => {
  class Price {
    constructor(readonly cents: number) {}

    get(unit: "cents" | "units") {
      return unit == "cents" ? this.cents : this.cents / 100;
    }

    map<R>(fn: (n: number) => R) {
      return fn(this.cents);
    }
  }

  const ArticleSchema = z
    .object({
      title: z.string(),
      author: z.string(),
      dates: z
        .object({ start: z.string(), end: z.string().optional() })
        .transform((d) => ({
          start: new Date(d.start),
          end: d.end ? new Date(d.end) : undefined,
        })),
      price: z.string().transform((v) => new Price(Number(v))),
      meta: z.object({ views: z.number(), tags: z.array(z.string()) }),
      contributors: z
        .array(
          z.object({
            slug: z.string(),
            role: z.object({ slug: z.string() }),
            since: z.date(),
          }),
        )
        .optional(),
      people: z.tuple([z.date()]).readonly(),
      peopleX: z.object({ foo: z.string() }),
    })
    .strict();

  const compareDates = (
    x: { start: Date; end?: Date },
    y: { start: Date; end?: Date },
  ) => x.start.getTime() - y.start.getTime();

  const articles = defineCollection({
    directory: "/articles",
    schema: ArticleSchema,
    extension: ".md",
    relations: {
      author: authorCollection,
      "contributors[*].slug": authorCollection,
      "contributors[*].role.slug": categoryCollection,
      "peopleX.foo": authorCollection,
    },
    views: (view) => ({
      default: view({}),
      raw: view({ resolveRelations: false }),
      shallow: view({
        resolveRelations: 1,
        sort: (x, y) => compareDates(x.dates, y.dates),
      }),
      full: view({
        resolveRelations: true,
        sort: (x, y) => compareDates(x.dates, y.dates),
      }),
    }),
  });

  for (const view of ["shallow", "full"] as const) {
    test(`${view} preserves class instances and plain siblings`, async () => {
      const [article] = await articles.getMany({ view });
      assert(article);
      const [raw] = await articles.getMany({ view: "raw" });
      assert(raw);
      expectTypeOf(article.dates).toEqualTypeOf<{
        start: Date;
        end: Date | undefined;
      }>();
      expectTypeOf(article.price).toEqualTypeOf<Price>();
      expectTypeOf(article.meta).toEqualTypeOf<{
        views: number;
        tags: Array<string>;
      }>();
      expectTypeOf(article.dates).toEqualTypeOf<typeof raw.dates>();
      expectTypeOf(article.price).toEqualTypeOf<typeof raw.price>();
    });

    test(`${view} resolves nested array paths and preserves optional containers`, async () => {
      const [article] = await articles.getMany({ view });
      assert(article);
      type Contributor = NonNullable<typeof article.contributors>[number];
      expectTypeOf<Contributor["slug"]["name"]>().toEqualTypeOf<string>();
      expectTypeOf<
        Contributor["role"]["slug"]["name"]
      >().toEqualTypeOf<string>();
      expectTypeOf<Contributor["since"]>().toEqualTypeOf<Date>();
      expectTypeOf(article.contributors).toExtend<
        Array<Contributor> | undefined
      >();
      expectTypeOf<undefined>().toExtend<typeof article.contributors>();
      expectTypeOf<Pick<typeof article, "contributors">>().toEqualTypeOf<{
        contributors?: typeof article.contributors;
      }>();
      expectTypeOf({}).toExtend<Pick<typeof article, "contributors">>();
    });

    test(`${view} requires a separator after a relation prefix`, async () => {
      const [article] = await articles.getMany({ view });
      assert(article);
      expectTypeOf(article.peopleX.foo.name).toEqualTypeOf<string>();
      expectTypeOf(article.people).toEqualTypeOf<readonly [Date]>();
    });
  }
});

describe("resolveRelations type behaviour", () => {
  test("false keeps strings", async () => {
    const posts = await postCollection.getMany({ view: "raw" });
    expectTypeOf(posts).items.toHaveProperty("author").toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves top-level relations to full entries", async () => {
    const posts = await postCollection.getMany({ view: "shallow" });
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("_meta")
      .toHaveProperty("slug")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .items.toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("true defaults to MaxDepth and resolves relations", async () => {
    const posts = await postCollection.getMany({ view: "full" });
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .items.toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("default (no option) keeps raw references", async () => {
    const posts = await postCollection.getMany();
    expectTypeOf(posts).items.toHaveProperty("author").toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .toEqualTypeOf<Array<string>>();
  });

  test("getOne mirrors getMany's behaviour", async () => {
    const raw = await postCollection.getOne("hello", {
      view: "raw",
    });
    expectTypeOf(raw.author).toEqualTypeOf<string>();
    const resolved = await postCollection.getOne("hello", {
      view: "shallow",
    });
    expectTypeOf(resolved.author.name).toEqualTypeOf<string>();
  });
});

describe("collection-level default", () => {
  const postCollectionDefaultFalse = defineCollection({
    views: (view) => ({
      default: view({
        resolveRelations: false,
      }),
      raw: view({ resolveRelations: false }),
      shallow: view({ resolveRelations: 1 }),
      deep: view({ resolveRelations: 2 }),
      full: view({ resolveRelations: true }),
    }),
    directory: "/posts-raw",
    schema: PostSchema,
    extension: ".md",
    relations: {
      author: authorCollection,
      "categories[*]": categoryCollection,
    },
  });

  test("getMany() with no args picks up the collection-level default of false", async () => {
    const posts = await postCollectionDefaultFalse.getMany();
    expectTypeOf(posts).items.toHaveProperty("author").toEqualTypeOf<string>();
  });

  test("named view is independent of collection-level default", async () => {
    const posts = await postCollectionDefaultFalse.getMany({
      view: "shallow",
    });
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });
});

describe("transitive depth (chained collections)", () => {
  // Post -> Editor -> Senior (acyclic chain). Lets us test depth 1 vs 2
  // without forward-ref / self-thunk circularity, which TS can't infer through.
  const SeniorSchema = z.object({ name: z.string() }).strict();
  const EditorSchema = z
    .object({ name: z.string(), lead: z.string() })
    .strict();
  const ChainedPostSchema = z
    .object({ title: z.string(), editor: z.string() })
    .strict();

  const seniorCollection = defineCollection({
    directory: "/seniors",
    schema: SeniorSchema,
    extension: ".json",
  });
  const editorCollection = defineCollection({
    directory: "/editors",
    schema: EditorSchema,
    extension: ".json",
    relations: { lead: seniorCollection },
  });
  const chainedPostCollection = defineCollection({
    views: (view) => ({
      default: view({}),
      raw: view({ resolveRelations: false }),
      shallow: view({ resolveRelations: 1 }),
      deep: view({ resolveRelations: 2 }),
      full: view({ resolveRelations: true }),
    }),
    directory: "/chained-posts",
    schema: ChainedPostSchema,
    extension: ".md",
    relations: { editor: editorCollection },
  });

  test("depth 1: top-level editor resolves; editor.lead stays string", async () => {
    const posts = await chainedPostCollection.getMany({ view: "shallow" });
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("lead")
      .toEqualTypeOf<string>();
  });

  test("depth 2: editor.lead also resolves to a Senior entry", async () => {
    const posts = await chainedPostCollection.getMany({ view: "deep" });
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("lead")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });
});

describe("items", () => {
  const HomeSchema = z
    .object({
      title: z.string(),
      "featured-posts": z.array(z.string()),
    })
    .strict();

  const homeItem = defineItem({
    views: (view) => ({
      default: view({}),
      raw: view({ resolveRelations: false }),
      shallow: view({ resolveRelations: 1 }),
      deep: view({ resolveRelations: 2 }),
      full: view({ resolveRelations: true }),
    }),
    file: "/pages/home.md",
    schema: HomeSchema,
    relations: {
      "featured-posts[*]": postCollection,
    },
  });

  test("_meta has fileName and filePath but no slug", async () => {
    const home = await homeItem.getData({ view: "raw" });
    const meta = home._meta;
    expectTypeOf(meta.fileName).toEqualTypeOf<`${string}.md`>();
    expectTypeOf(meta.filePath).toEqualTypeOf<`${string}.md`>();
    expectTypeOf<keyof typeof meta>().toEqualTypeOf<"fileName" | "filePath">();
  });

  test("resolveRelations: false keeps strings", async () => {
    const home = await homeItem.getData({ view: "raw" });
    expectTypeOf(home["featured-posts"]).toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves featured-posts to full Post entries", async () => {
    const home = await homeItem.getData({ view: "shallow" });
    expectTypeOf(home["featured-posts"])
      .items.toHaveProperty("title")
      .toEqualTypeOf<string>();
    expectTypeOf(home["featured-posts"])
      .items.toHaveProperty("_meta")
      .toHaveProperty("slug")
      .toEqualTypeOf<string>();
  });
});

describe("collection → item relation", () => {
  const ConfigSchema = z.object({ siteName: z.string() }).strict();
  const configItem = defineItem({
    file: "/config/site.json",
    schema: ConfigSchema,
  });

  const FooSchema = z
    .object({ title: z.string(), siteConfig: z.string() })
    .strict();

  const fooCollection = defineCollection({
    views: (view) => ({
      default: view({}),
      raw: view({ resolveRelations: false }),
      shallow: view({ resolveRelations: 1 }),
      deep: view({ resolveRelations: 2 }),
      full: view({ resolveRelations: true }),
    }),
    directory: "/foos",
    schema: FooSchema,
    extension: ".json",
    relations: { siteConfig: configItem },
  });

  test("depth 1: collection → item resolves to item shape", async () => {
    const foos = await fooCollection.getMany({ view: "shallow" });
    const foo = foos[0];
    assert(foo);
    expectTypeOf(foo.siteConfig.siteName).toEqualTypeOf<string>();
    expectTypeOf<keyof typeof foo.siteConfig._meta>().toEqualTypeOf<
      "fileName" | "filePath"
    >();
  });

  test("resolveRelations: false keeps the relation as a string", async () => {
    const foos = await fooCollection.getMany({ view: "raw" });
    expectTypeOf(foos)
      .items.toHaveProperty("siteConfig")
      .toEqualTypeOf<string>();
  });
});

describe("all primitive relation pairs", () => {
  const item = defineItem({
    file: "/site.json",
    schema: z.object({ siteName: z.string() }),
  });
  const tree = defineTree({
    directory: "/docs",
    extension: ".md",
    titleField: "title",
    schema: z.object({ title: z.string(), site: z.string() }),
    relations: { site: item },
    views: (view) => ({
      default: view({
        augment: () => ({ derived: true }),
      }),
      detail: view({
        resolveRelations: true,
        augment: () => ({ viewDerived: true }),
      }),
    }),
  });
  const config = {
    schema: z.object({
      title: z.string(),
      author: z.string(),
      site: z.string(),
      doc: z.string(),
      links: z.array(z.object({ doc: z.string() })),
    }),
    relations: {
      author: authorCollection,
      site: () => item,
      doc: tree,
      "links[*].doc": () => tree,
    },
  };
  const posts = defineCollection({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({}),
      shallow: view({ resolveRelations: 1 as const }),
      deep: view({ resolveRelations: 2 as const }),
    }),
    directory: "/related-posts",
    extension: ".json",
  });
  const docs = defineTree({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({}),
      shallow: view({ resolveRelations: 1 as const }),
      deep: view({ resolveRelations: 2 as const }),
    }),
    directory: "/related-docs",
    extension: ".json",
    titleField: "title",
  });
  const home = defineItem({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({}),
      shallow: view({ resolveRelations: 1 as const }),
      deep: view({ resolveRelations: 2 as const }),
    }),
    file: "/related-home.json",
  });

  test("every source infers collection, item, and tree entries", async () => {
    const entries = [
      await posts.getOne("hello", { view: "shallow" }),
      await docs.getEntry("hello", { view: "shallow" }),
      await home.getData({ view: "shallow" }),
    ];
    for (const entry of entries) {
      expectTypeOf(entry.author.name).toEqualTypeOf<string>();
      expectTypeOf(entry.site.siteName).toEqualTypeOf<string>();
      expectTypeOf(entry.doc.title).toEqualTypeOf<string>();
      expectTypeOf(entry.doc._meta).toEqualTypeOf<TreeEntryMeta<".md">>();
      expectTypeOf(entry.doc.site).toEqualTypeOf<string>();
      expectTypeOf(entry.links)
        .items.toHaveProperty("doc")
        .toEqualTypeOf<typeof entry.doc>();
      // @ts-expect-error Embedded tree targets do not include augment fields.
      entry.doc.derived;
      // @ts-expect-error Embedded tree targets do not apply their named views.
      entry.doc.viewDerived;
    }
  });

  test("raw references and deeper tree relations respect the selected depth", async () => {
    for (const entry of [
      await posts.getOne("hello", { view: "raw" }),
      await docs.getEntry("hello", { view: "raw" }),
      await home.getData({ view: "raw" }),
    ]) {
      expectTypeOf(entry.doc).toEqualTypeOf<string>();
      expectTypeOf(entry.links)
        .items.toHaveProperty("doc")
        .toEqualTypeOf<string>();
    }
    for (const entry of [
      await posts.getOne("hello", { view: "deep" }),
      await docs.getEntry("hello", { view: "deep" }),
      await home.getData({ view: "deep" }),
    ]) {
      expectTypeOf(entry.doc.site.siteName).toEqualTypeOf<string>();
      expectTypeOf(entry.links)
        .items.toHaveProperty("doc")
        .toHaveProperty("site")
        .toHaveProperty("siteName")
        .toEqualTypeOf<string>();
    }
  });
});
