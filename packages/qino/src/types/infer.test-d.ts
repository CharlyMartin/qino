import {
  type Collection,
  createQino,
  type Infer,
  type Singleton,
  type Tree,
} from "qino";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const site = qino.createSingleton({
  file: "/site.json",
  schema: z.object({ name: z.string() }),
});
const authors = qino.createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string(), site: z.string() }),
  relations: { site },
  views: (view) => ({
    default: view({
      augment: () => ({ targetDerived: true }),
    }),
    detail: view({ augment: () => ({ targetViewDerived: true }) }),
  }),
});
const schema = z.object({
  title: z.string(),
  body: z.string(),
  count: z.string().transform(Number),
  author: z.string(),
  output: z.string(),
  views: z.number(),
});
const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema,
  relations: { author: () => authors },
  views: (view) => ({
    default: view({
      resolveRelations: true,
      augment: async (entry) => ({ authorName: entry.author.name }),
    }),
    raw: view({}),
    highlight: view({
      resolveRelations: 1,
      augment: (entry) => ({ label: entry.author.name }),
    }),
    deep: view({ resolveRelations: 2 }),
    full: view({ resolveRelations: true }),
  }),
});

test("collection inference matches default and named getter outputs", async () => {
  type PostTypes = Infer<typeof posts>;
  const post = await posts.getOne("hello");
  const all = await posts.getAll();
  const highlight = await posts.getOne("hello", { view: "highlight" });
  const highlights = await posts.getAll({ view: "highlight" });
  expectTypeOf<PostTypes["output"]>().toEqualTypeOf<typeof post>();
  expectTypeOf<Array<PostTypes["output"]>>().toEqualTypeOf<typeof all>();
  expectTypeOf<PostTypes["views"]["highlight"]>().toEqualTypeOf<
    typeof highlight
  >();
  expectTypeOf<Array<PostTypes["views"]["highlight"]>>().toEqualTypeOf<
    typeof highlights
  >();
  expectTypeOf<PostTypes["output"]["count"]>().toEqualTypeOf<number>();
  expectTypeOf<PostTypes["output"]["authorName"]>().toEqualTypeOf<string>();
  expectTypeOf<
    PostTypes["output"]["_meta"]["filePath"]
  >().toEqualTypeOf<`${string}.md`>();
  expectTypeOf<PostTypes["output"]["_meta"]["slug"]>().toEqualTypeOf<string>();
  expectTypeOf<
    PostTypes["views"]["highlight"]["label"]
  >().toEqualTypeOf<string>();
  expectTypeOf<PostTypes["output"]["output"]>().toEqualTypeOf<string>();
  expectTypeOf<PostTypes["output"]["views"]>().toEqualTypeOf<number>();
  expectTypeOf<keyof PostTypes["views"]>().toEqualTypeOf<
    "default" | "raw" | "highlight" | "deep" | "full"
  >();
});

test("views preserve independent augmentation and relation depths", async () => {
  type Views = Infer<typeof posts>["views"];
  const raw = await posts.getOne("hello", { view: "raw" });
  const deep = await posts.getOne("hello", { view: "deep" });
  const full = await posts.getOne("hello", { view: "full" });
  expectTypeOf<Views["raw"]>().toEqualTypeOf<typeof raw>();
  expectTypeOf<Views["deep"]>().toEqualTypeOf<typeof deep>();
  expectTypeOf<Views["full"]>().toEqualTypeOf<typeof full>();
  expectTypeOf<Views["raw"]["author"]>().toEqualTypeOf<string>();
  expectTypeOf<Views["highlight"]["author"]["site"]>().toEqualTypeOf<string>();
  expectTypeOf<
    Views["deep"]["author"]["site"]["name"]
  >().toEqualTypeOf<string>();
  expectTypeOf<
    Views["full"]["author"]["site"]["name"]
  >().toEqualTypeOf<string>();
  // @ts-expect-error Named views do not inherit default augmentation.
  expectTypeOf<Views["raw"]["authorName"]>();
  // @ts-expect-error Named views do not inherit sibling augmentation.
  expectTypeOf<Views["deep"]["label"]>();
  // @ts-expect-error Embedded targets do not apply their own augmentation.
  expectTypeOf<Views["full"]["author"]["targetDerived"]>();
  // @ts-expect-error Embedded targets do not apply their own views.
  expectTypeOf<Views["full"]["author"]["targetViewDerived"]>();
});

test("singleton inference matches getters and singleton metadata", async () => {
  const home = qino.createSingleton({
    file: "/home.mdx",
    schema,
    relations: { author: authors },
    views: (view) => ({
      default: view({
        augment: (entry) => ({ length: entry.body.length }),
      }),
      highlight: view({
        resolveRelations: true,
        augment: async (entry) => ({ label: entry.author.name }),
      }),
      raw: view({}),
    }),
  });
  type HomeTypes = Infer<typeof home>;
  const data = await home.getData();
  const highlight = await home.getData({ view: "highlight" });
  const raw = await home.getData({ view: "raw" });
  expectTypeOf<HomeTypes["output"]>().toEqualTypeOf<typeof data>();
  expectTypeOf<HomeTypes["views"]["highlight"]>().toEqualTypeOf<
    typeof highlight
  >();
  expectTypeOf<HomeTypes["views"]["raw"]>().toEqualTypeOf<typeof raw>();
  expectTypeOf<HomeTypes["output"]["length"]>().toEqualTypeOf<number>();
  expectTypeOf<HomeTypes["output"]["author"]>().toEqualTypeOf<string>();
  expectTypeOf<
    HomeTypes["views"]["highlight"]["label"]
  >().toEqualTypeOf<string>();
  expectTypeOf<
    HomeTypes["output"]["_meta"]["fileName"]
  >().toEqualTypeOf<`${string}.mdx`>();
  expectTypeOf<keyof HomeTypes["output"]["_meta"]>().toEqualTypeOf<
    "fileName" | "filePath"
  >();
});

test("tree inference describes content entries and their views", async () => {
  const docs = qino.createTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema,
    relations: { author: authors },
    views: (view) => ({
      default: view({
        resolveRelations: 1,
        augment: async (entry) => ({ label: entry.author.name }),
      }),
      highlight: view({ augment: (entry) => ({ length: entry.body.length }) }),
      full: view({ resolveRelations: true }),
    }),
  });
  type DocTypes = Infer<typeof docs>;
  const entry = await docs.getEntry("hello");
  const highlight = await docs.getEntry("hello", { view: "highlight" });
  const full = await docs.getEntry("hello", { view: "full" });
  expectTypeOf<DocTypes["output"]>().toEqualTypeOf<typeof entry>();
  expectTypeOf<DocTypes["views"]["highlight"]>().toEqualTypeOf<
    typeof highlight
  >();
  expectTypeOf<DocTypes["views"]["full"]>().toEqualTypeOf<typeof full>();
  expectTypeOf<DocTypes["output"]["label"]>().toEqualTypeOf<string>();
  expectTypeOf<
    DocTypes["views"]["highlight"]["author"]
  >().toEqualTypeOf<string>();
  expectTypeOf<
    DocTypes["views"]["highlight"]["length"]
  >().toEqualTypeOf<number>();
  expectTypeOf<
    DocTypes["output"]["_meta"]["fileName"]
  >().toEqualTypeOf<`${string}.markdown`>();
  expectTypeOf<DocTypes["output"]["_meta"]["slug"]>().toEqualTypeOf<string>();
  // @ts-expect-error Content entries do not have navigation children.
  expectTypeOf<DocTypes["output"]["children"]>();
});

test("omitted views have no keys", () => {
  const collection = qino.createCollection({
    directory: "/plain",
    extension: ".json",
    schema,
  });
  const tree = qino.createTree({
    directory: "/plain-docs",
    extension: ".md",
    titleField: "title",
    schema,
  });
  const empty = qino.createSingleton({
    file: "/empty.json",
    schema,
  });
  expectTypeOf<
    keyof Infer<typeof collection>["views"]
  >().toEqualTypeOf<never>();
  expectTypeOf<keyof Infer<typeof tree>["views"]>().toEqualTypeOf<never>();
  expectTypeOf<keyof Infer<typeof site>["views"]>().toEqualTypeOf<never>();
  expectTypeOf<keyof Infer<typeof empty>["views"]>().toEqualTypeOf<never>();
});

test("rejects invalid inputs and unknown view names", () => {
  // @ts-expect-error A schema is not a Qino primitive.
  expectTypeOf<Infer<typeof schema>>();
  // @ts-expect-error An arbitrary object is not a Qino primitive.
  expectTypeOf<Infer<object>>();
  // @ts-expect-error A Qino instance is not a content primitive.
  expectTypeOf<Infer<typeof qino>>();
  // @ts-expect-error Only declared named views can be selected.
  expectTypeOf<Infer<typeof posts>["views"]["missing"]>();
  expectTypeOf<Infer<typeof posts>["views"]["default"]>().toEqualTypeOf<
    Infer<typeof posts>["output"]
  >();
});

test("supports generics constrained by public primitive aliases", () => {
  type CollectionOutput<P extends Collection<typeof schema, ".md">> =
    Infer<P>["output"];
  type SingletonOutput<P extends Singleton<typeof schema, ".json">> =
    Infer<P>["output"];
  type TreeOutput<P extends Tree<typeof schema, ".mdx", "title">> =
    Infer<P>["output"];
  type Highlight<P extends typeof posts> = Infer<P>["views"]["highlight"];

  expectTypeOf<
    CollectionOutput<Collection<typeof schema, ".md">>["count"]
  >().toEqualTypeOf<number>();
  expectTypeOf<
    SingletonOutput<Singleton<typeof schema, ".json">>["count"]
  >().toEqualTypeOf<number>();
  expectTypeOf<
    TreeOutput<Tree<typeof schema, ".mdx", "title">>["count"]
  >().toEqualTypeOf<number>();
  expectTypeOf<Highlight<typeof posts>>().toEqualTypeOf<
    Infer<typeof posts>["views"]["highlight"]
  >();
});
