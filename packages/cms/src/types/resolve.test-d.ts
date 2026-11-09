import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { TreeEntryMeta } from "./tree";

const { defineCollection, defineItem, defineTree } = initQino({
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
  directory: "authors",
  schema: AuthorSchema,
  extension: ".json",
});

const categoryCollection = defineCollection({
  directory: "categories",
  schema: CategorySchema,
  extension: ".json",
});

const postCollection = defineCollection({
  views: (view) => ({
    default: view({}),
    raw: view({ resolveDepth: { author: 0, "categories[*]": 0 } }),
    shallow: view({ resolveDepth: { author: 1, "categories[*]": 1 } }),
    deep: view({ resolveDepth: { author: 2, "categories[*]": 2 } }),
    full: view({}),
  }),
  directory: "posts",
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
    directory: "articles",
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
      raw: view({
        resolveDepth: {
          author: 0,
          "contributors[*].slug": 0,
          "contributors[*].role.slug": 0,
          "peopleX.foo": 0,
        },
      }),
      shallow: view({
        resolveDepth: { author: 1, "contributors[*].slug": 1 },
        sort: (x, y) => compareDates(x.dates, y.dates),
      }),
      full: view({
        sort: (x, y) => compareDates(x.dates, y.dates),
      }),
    }),
  });

  for (const view of ["shallow", "full"] as const) {
    test(`${view} preserves class instances and plain siblings`, async () => {
      const [article] = await articles.getEntries({ view });
      assert(article);
      const [raw] = await articles.getEntries({ view: "raw" });
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
      const [article] = await articles.getEntries({ view });
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
      const [article] = await articles.getEntries({ view });
      assert(article);
      expectTypeOf(article.peopleX.foo.name).toEqualTypeOf<string>();
      expectTypeOf(article.people).toEqualTypeOf<readonly [Date]>();
    });
  }
});

describe("view resolveDepth type behaviour", () => {
  test("0 keeps strings", async () => {
    const posts = await postCollection.getEntries({ view: "raw" });
    expectTypeOf(posts).items.toHaveProperty("author").toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves top-level relations to full entries", async () => {
    const posts = await postCollection.getEntries({ view: "shallow" });
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

  test("an empty view resolves each relation to its own depth", async () => {
    const posts = await postCollection.getEntries({ view: "full" });
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .items.toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("default (no option) resolves each relation one hop", async () => {
    const posts = await postCollection.getEntries();
    expectTypeOf(posts)
      .items.toHaveProperty("author")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("categories")
      .items.toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("getEntry mirrors getEntries behaviour", async () => {
    const raw = await postCollection.getEntry("hello", {
      view: "raw",
    });
    expectTypeOf(raw.author).toEqualTypeOf<string>();
    const resolved = await postCollection.getEntry("hello", {
      view: "shallow",
    });
    expectTypeOf(resolved.author.name).toEqualTypeOf<string>();
  });
});

describe("collection-level default", () => {
  const postCollectionDefaultFalse = defineCollection({
    views: (view) => ({
      default: view({
        resolveDepth: { author: 0, "categories[*]": 0 },
      }),
      shallow: view({ resolveDepth: { author: 1 } }),
    }),
    directory: "posts-raw",
    schema: PostSchema,
    extension: ".md",
    relations: {
      author: authorCollection,
      "categories[*]": categoryCollection,
    },
  });

  test("getEntries() with no args picks up the default view's depths", async () => {
    const posts = await postCollectionDefaultFalse.getEntries();
    expectTypeOf(posts).items.toHaveProperty("author").toEqualTypeOf<string>();
  });

  test("named view is independent of collection-level default", async () => {
    const posts = await postCollectionDefaultFalse.getEntries({
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
    directory: "seniors",
    schema: SeniorSchema,
    extension: ".json",
  });
  const editorCollection = defineCollection({
    directory: "editors",
    schema: EditorSchema,
    extension: ".json",
    relations: { lead: seniorCollection },
  });
  const chainedPostCollection = defineCollection({
    views: (view) => ({
      default: view({}),
      shallow: view({ resolveDepth: { editor: 1 } }),
      deep: view({ resolveDepth: { editor: 2 } }),
    }),
    directory: "chained-posts",
    schema: ChainedPostSchema,
    extension: ".md",
    relations: { editor: editorCollection },
  });

  test("depth 1: top-level editor resolves; editor.lead stays string", async () => {
    const posts = await chainedPostCollection.getEntries({ view: "shallow" });
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("lead")
      .toEqualTypeOf<string>();
  });

  test("own depths: editor.lead stays string by default", async () => {
    const posts = await chainedPostCollection.getEntries();
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("lead")
      .toEqualTypeOf<string>();
  });

  test("own depths: resolveDepth 2 resolves editor.lead too", async () => {
    const deepPosts = defineCollection({
      directory: "deep-chained-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: { target: editorCollection, resolveDepth: 2 } },
    });
    const posts = await deepPosts.getEntries();
    expectTypeOf(posts)
      .items.toHaveProperty("editor")
      .toHaveProperty("lead")
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("own depths: resolveDepth 0 keeps the string", async () => {
    const rawPosts = defineCollection({
      directory: "raw-chained-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: { target: editorCollection, resolveDepth: 0 } },
      views: (view) => ({
        default: view({}),
        deep: view({ resolveDepth: { editor: 2 } }),
      }),
    });
    expectTypeOf(
      (await rawPosts.getEntry("hello")).editor,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await rawPosts.getEntry("hello", { view: "deep" })).editor.lead.name,
    ).toEqualTypeOf<string>();
  });

  test("own depths: a nested resolveDepth can't exceed the hops left", async () => {
    const leadEditors = defineCollection({
      directory: "lead-editors",
      schema: EditorSchema,
      extension: ".json",
      relations: { lead: { target: seniorCollection, resolveDepth: 6 } },
    });
    const cappedPosts = defineCollection({
      directory: "capped-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: leadEditors },
    });
    expectTypeOf(
      (await cappedPosts.getEntry("hello")).editor.lead,
    ).toEqualTypeOf<string>();
  });

  test("own depths: an optional resolveDepth includes every value it can hold", async () => {
    const editor: { target: typeof editorCollection; resolveDepth?: 0 | 2 } = {
      target: editorCollection,
    };
    const looseEditors = defineCollection({
      directory: "loose-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor },
    });
    const entry = await looseEditors.getEntry("hello");
    expectTypeOf(entry.editor).extract<string>().toEqualTypeOf<string>();
    expectTypeOf(entry.editor)
      .exclude<string>()
      .toHaveProperty("lead")
      .extract<string>()
      .toEqualTypeOf<string>();
    expectTypeOf(entry.editor)
      .exclude<string>()
      .toHaveProperty("lead")
      .exclude<string>()
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("own depths: a union declaration keeps each alternative's depth", async () => {
    const mixedEditors = defineCollection({
      directory: "mixed-editor-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: {
        editor:
          Math.random() > 0.5
            ? editorCollection
            : { target: editorCollection, resolveDepth: 0 as const },
      },
    });
    const { editor } = await mixedEditors.getEntry("hello");
    expectTypeOf(editor).extract<string>().toEqualTypeOf<string>();
    expectTypeOf(editor)
      .exclude<string>()
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("a view depth overrides the branch's own resolveDepth", async () => {
    const quietEditors = defineCollection({
      directory: "quiet-editors",
      schema: EditorSchema,
      extension: ".json",
      relations: { lead: { target: seniorCollection, resolveDepth: 0 } },
    });
    const overridePosts = defineCollection({
      directory: "override-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: quietEditors },
      views: (view) => ({
        default: view({}),
        deep: view({ resolveDepth: { editor: 2 } }),
      }),
    });
    expectTypeOf(
      (await overridePosts.getEntry("hello")).editor.lead,
    ).toEqualTypeOf<string>();
    expectTypeOf(
      (await overridePosts.getEntry("hello", { view: "deep" })).editor.lead
        .name,
    ).toEqualTypeOf<string>();
  });

  test("an unknown or out-of-range view depth is a type error", () => {
    defineCollection({
      directory: "typo-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: editorCollection },
      views: (view) => ({
        default: view({}),
        // @ts-expect-error "editr" isn't a relation path.
        typo: view({ resolveDepth: { editr: 1 } }),
        // @ts-expect-error Depths go from 0 to 6.
        far: view({ resolveDepth: { editor: 7 } }),
        // @ts-expect-error Booleans aren't depths.
        raw: view({ resolveDepth: false }),
      }),
    });
  });

  test("a union view depth resolves either way", async () => {
    const pickDeep = Math.random() > 0.5;
    const mixedPosts = defineCollection({
      directory: "mixed-posts",
      schema: ChainedPostSchema,
      extension: ".md",
      relations: { editor: editorCollection },
      views: (view) => ({
        default: view({
          resolveDepth: pickDeep ? {} : { editor: 2 as const },
        }),
      }),
    });
    const { editor } = await mixedPosts.getEntry("hello");
    expectTypeOf(editor.lead).extract<string>().toEqualTypeOf<string>();
    expectTypeOf(editor.lead)
      .exclude<string>()
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("a union of view configs keeps each alternative's keys", async () => {
    const CoverPostSchema = ChainedPostSchema.extend({ cover: z.string() });
    const depths = (Math.random() > 0.5 ? { editor: 0 } : { cover: 0 }) as
      | { editor: 0 }
      | { cover: 0 };
    const unionPosts = defineCollection({
      directory: "union-posts",
      schema: CoverPostSchema,
      extension: ".md",
      relations: { editor: editorCollection, cover: seniorCollection },
      views: (view) => ({ default: view({ resolveDepth: depths }) }),
    });
    const { editor, cover } = await unionPosts.getEntry("hello");
    expectTypeOf(editor).extract<string>().toEqualTypeOf<string>();
    expectTypeOf(editor)
      .exclude<string>()
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
    expectTypeOf(cover).extract<string>().toEqualTypeOf<string>();
    expectTypeOf(cover)
      .exclude<string>()
      .toHaveProperty("name")
      .toEqualTypeOf<string>();
  });

  test("depth 2: editor.lead also resolves to a Senior entry", async () => {
    const posts = await chainedPostCollection.getEntries({ view: "deep" });
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
      raw: view({ resolveDepth: { "featured-posts[*]": 0 } }),
      shallow: view({ resolveDepth: { "featured-posts[*]": 1 } }),
    }),
    file: "pages/home.md",
    schema: HomeSchema,
    relations: {
      "featured-posts[*]": postCollection,
    },
  });

  test("_meta has fileName and filePath but no slug", async () => {
    const home = await homeItem.getEntry({ view: "raw" });
    const meta = home._meta;
    expectTypeOf(meta.fileName).toEqualTypeOf<`${string}.md`>();
    expectTypeOf(meta.filePath).toEqualTypeOf<`${string}.md`>();
    expectTypeOf<keyof typeof meta>().toEqualTypeOf<"fileName" | "filePath">();
  });

  test("resolveDepth 0 keeps strings", async () => {
    const home = await homeItem.getEntry({ view: "raw" });
    expectTypeOf(home["featured-posts"]).toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves featured-posts to full Post entries", async () => {
    const home = await homeItem.getEntry({ view: "shallow" });
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
    file: "config/site.json",
    schema: ConfigSchema,
  });

  const FooSchema = z
    .object({ title: z.string(), siteConfig: z.string() })
    .strict();

  const fooCollection = defineCollection({
    views: (view) => ({
      default: view({}),
      raw: view({ resolveDepth: { siteConfig: 0 } }),
      shallow: view({ resolveDepth: { siteConfig: 1 } }),
    }),
    directory: "foos",
    schema: FooSchema,
    extension: ".json",
    relations: { siteConfig: configItem },
  });

  test("depth 1: collection → item resolves to item shape", async () => {
    const foos = await fooCollection.getEntries({ view: "shallow" });
    const foo = foos[0];
    assert(foo);
    expectTypeOf(foo.siteConfig.siteName).toEqualTypeOf<string>();
    expectTypeOf<keyof typeof foo.siteConfig._meta>().toEqualTypeOf<
      "fileName" | "filePath"
    >();
  });

  test("resolveDepth 0 keeps the relation as a string", async () => {
    const foos = await fooCollection.getEntries({ view: "raw" });
    expectTypeOf(foos)
      .items.toHaveProperty("siteConfig")
      .toEqualTypeOf<string>();
  });
});

describe("all primitive relation pairs", () => {
  const item = defineItem({
    file: "site.json",
    schema: z.object({ siteName: z.string() }),
  });
  const tree = defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema: z.object({ title: z.string(), site: z.string() }),
    relations: { site: item },
    views: (view) => ({
      default: view({
        augment: () => ({ derived: true }),
      }),
      detail: view({
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
  const allAt = <const D extends 0 | 1 | 2>(depth: D) => ({
    author: depth,
    site: depth,
    doc: depth,
    "links[*].doc": depth,
  });
  const posts = defineCollection({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({ resolveDepth: allAt(0) }),
      shallow: view({ resolveDepth: allAt(1) }),
      deep: view({ resolveDepth: allAt(2) }),
    }),
    directory: "related-posts",
    extension: ".json",
  });
  const docs = defineTree({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({ resolveDepth: allAt(0) }),
      shallow: view({ resolveDepth: allAt(1) }),
      deep: view({ resolveDepth: allAt(2) }),
    }),
    directory: "related-docs",
    extension: ".json",
    titleField: "title",
  });
  const home = defineItem({
    ...config,
    views: (view) => ({
      default: view({}),
      raw: view({ resolveDepth: allAt(0) }),
      shallow: view({ resolveDepth: allAt(1) }),
      deep: view({ resolveDepth: allAt(2) }),
    }),
    file: "related-home.json",
  });

  test("every source infers collection, item, and tree entries", async () => {
    const entries = [
      await posts.getEntry("hello", { view: "shallow" }),
      await docs.getEntry("hello", { view: "shallow" }),
      await home.getEntry({ view: "shallow" }),
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
      await posts.getEntry("hello", { view: "raw" }),
      await docs.getEntry("hello", { view: "raw" }),
      await home.getEntry({ view: "raw" }),
    ]) {
      expectTypeOf(entry.doc).toEqualTypeOf<string>();
      expectTypeOf(entry.links)
        .items.toHaveProperty("doc")
        .toEqualTypeOf<string>();
    }
    for (const entry of [
      await posts.getEntry("hello", { view: "deep" }),
      await docs.getEntry("hello", { view: "deep" }),
      await home.getEntry({ view: "deep" }),
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
