import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createCollection } from "../runtime/collections";
import { createSingleton } from "../runtime/singletons";

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

const authorCollection = createCollection({
  directory: "/authors",
  schema: AuthorSchema,
  extension: ".json",
});

const categoryCollection = createCollection({
  directory: "/categories",
  schema: CategorySchema,
  extension: ".json",
});

const postCollection = createCollection({
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
  },
});

describe("resolveRelations type behaviour", () => {
  test("false keeps strings", async () => {
    const posts = await postCollection.getAll({ resolveRelations: false });
    expectTypeOf(posts[0].author).toEqualTypeOf<string>();
    expectTypeOf(posts[0].categories).toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves top-level relations to full entries", async () => {
    const posts = await postCollection.getAll({ resolveRelations: 1 });
    expectTypeOf(posts[0].author.name).toEqualTypeOf<string>();
    expectTypeOf(posts[0].author._meta.slug).toEqualTypeOf<string>();
    expectTypeOf(posts[0].categories[0].name).toEqualTypeOf<string>();
  });

  test("true defaults to MaxDepth and resolves relations", async () => {
    const posts = await postCollection.getAll({ resolveRelations: true });
    expectTypeOf(posts[0].author.name).toEqualTypeOf<string>();
    expectTypeOf(posts[0].categories[0].name).toEqualTypeOf<string>();
  });

  test("default (no option) resolves (default is true)", async () => {
    const posts = await postCollection.getAll();
    expectTypeOf(posts[0].author.name).toEqualTypeOf<string>();
  });

  test("getOne mirrors getAll's behaviour", async () => {
    const raw = await postCollection.getOne("hello", {
      resolveRelations: false,
    });
    expectTypeOf(raw.author).toEqualTypeOf<string>();
    const resolved = await postCollection.getOne("hello", {
      resolveRelations: 1,
    });
    expectTypeOf(resolved.author.name).toEqualTypeOf<string>();
  });
});

describe("collection-level default", () => {
  const postCollectionDefaultFalse = createCollection({
    directory: "/posts-raw",
    schema: PostSchema,
    extension: ".md",
    relations: {
      author: authorCollection,
      "categories[*]": categoryCollection,
    },
    resolveRelations: false,
  });

  test("getAll() with no args picks up the collection-level default of false", async () => {
    const posts = await postCollectionDefaultFalse.getAll();
    expectTypeOf(posts[0].author).toEqualTypeOf<string>();
  });

  test("per-call option overrides collection-level default", async () => {
    const posts = await postCollectionDefaultFalse.getAll({
      resolveRelations: 1,
    });
    expectTypeOf(posts[0].author.name).toEqualTypeOf<string>();
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

  const seniorCollection = createCollection({
    directory: "/seniors",
    schema: SeniorSchema,
    extension: ".json",
  });
  const editorCollection = createCollection({
    directory: "/editors",
    schema: EditorSchema,
    extension: ".json",
    relations: { lead: seniorCollection },
  });
  const chainedPostCollection = createCollection({
    directory: "/chained-posts",
    schema: ChainedPostSchema,
    extension: ".md",
    relations: { editor: editorCollection },
  });

  test("depth 1: top-level editor resolves; editor.lead stays string", async () => {
    const posts = await chainedPostCollection.getAll({ resolveRelations: 1 });
    expectTypeOf(posts[0].editor.name).toEqualTypeOf<string>();
    expectTypeOf(posts[0].editor.lead).toEqualTypeOf<string>();
  });

  test("depth 2: editor.lead also resolves to a Senior entry", async () => {
    const posts = await chainedPostCollection.getAll({ resolveRelations: 2 });
    expectTypeOf(posts[0].editor.name).toEqualTypeOf<string>();
    expectTypeOf(posts[0].editor.lead.name).toEqualTypeOf<string>();
  });
});

describe("singletons", () => {
  const HomeSchema = z
    .object({
      title: z.string(),
      "featured-posts": z.array(z.string()),
    })
    .strict();

  const homeSingleton = createSingleton({
    file: "/pages/home.md",
    schema: HomeSchema,
    relations: {
      "featured-posts[*]": postCollection,
    },
  });

  test("_meta has fileName and filePath but no slug", async () => {
    const home = await homeSingleton.getData({ resolveRelations: false });
    const meta = home._meta;
    expectTypeOf(meta.fileName).toEqualTypeOf<`${string}.md`>();
    expectTypeOf(meta.filePath).toEqualTypeOf<`${string}.md`>();
    expectTypeOf<keyof typeof meta>().toEqualTypeOf<"fileName" | "filePath">();
  });

  test("resolveRelations: false keeps strings", async () => {
    const home = await homeSingleton.getData({ resolveRelations: false });
    expectTypeOf(home["featured-posts"]).toEqualTypeOf<Array<string>>();
  });

  test("depth 1 resolves featured-posts to full Post entries", async () => {
    const home = await homeSingleton.getData({ resolveRelations: 1 });
    expectTypeOf(home["featured-posts"][0].title).toEqualTypeOf<string>();
    expectTypeOf(home["featured-posts"][0]._meta.slug).toEqualTypeOf<string>();
  });
});

describe("collection → singleton relation", () => {
  const ConfigSchema = z.object({ siteName: z.string() }).strict();
  const configSingleton = createSingleton({
    file: "/config/site.json",
    schema: ConfigSchema,
  });

  const FooSchema = z
    .object({ title: z.string(), siteConfig: z.string() })
    .strict();

  const fooCollection = createCollection({
    directory: "/foos",
    schema: FooSchema,
    extension: ".json",
    relations: { siteConfig: configSingleton },
  });

  test("depth 1: collection → singleton resolves to singleton shape", async () => {
    const foos = await fooCollection.getAll({ resolveRelations: 1 });
    const foo = foos[0];
    expectTypeOf(foo.siteConfig.siteName).toEqualTypeOf<string>();
    expectTypeOf<keyof typeof foo.siteConfig._meta>().toEqualTypeOf<
      "fileName" | "filePath"
    >();
  });

  test("resolveRelations: false keeps the relation as a string", async () => {
    const foos = await fooCollection.getAll({ resolveRelations: false });
    expectTypeOf(foos[0].siteConfig).toEqualTypeOf<string>();
  });
});
