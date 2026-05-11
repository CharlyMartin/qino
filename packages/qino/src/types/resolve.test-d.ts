import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { createCollection } from "../runtime/collections";
import { clearRegistry } from "../runtime/registry";

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

clearRegistry();

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
