import { type Infer, initQino } from "@qino/cms";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import type { ObjectSchema } from "./schema";

const qino = initQino({
  contentFolder: "content",
  media: { folder: "public" },
});
const metaSchema = z.object({
  title: z.string(),
  _meta: z.string().optional(),
});
const markdownSchema = z.object({
  title: z.string(),
  markdown: z.string().optional(),
});
const rawSchema = z.object({ title: z.string(), raw: z.string() });

test("rejects optional reserved declarations on all three primitives", () => {
  qino.defineCollection({
    directory: "posts",
    extension: ".json",
    // @ts-expect-error _meta is reserved in JSON as well as Markdown.
    schema: metaSchema,
  });
  qino.defineItem({
    file: "home.md",
    // @ts-expect-error _meta is reserved.
    schema: metaSchema,
  });
  qino.defineTree({
    directory: "docs",
    extension: ".mdx",
    titleField: "title",
    // @ts-expect-error _meta is reserved.
    schema: metaSchema,
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    // @ts-expect-error markdown is reserved in Markdown entries.
    schema: markdownSchema,
  });
  qino.defineItem({
    file: "home.mdx",
    // @ts-expect-error markdown is reserved in Markdown entries.
    schema: markdownSchema,
  });
  qino.defineTree({
    directory: "docs",
    extension: ".markdown",
    titleField: "title",
    // @ts-expect-error markdown is reserved in Markdown entries.
    schema: markdownSchema,
  });
  qino.defineItem({
    file: "home.md",
    // @ts-expect-error raw is reserved in Markdown entries.
    schema: rawSchema,
  });
});

test("checks schema inputs, transformed outputs, and union branches", () => {
  qino.defineItem({
    file: "home.md",
    // @ts-expect-error Schema inputs cannot declare markdown.
    schema: markdownSchema.transform(({ title }) => ({ title })),
  });
  qino.defineItem({
    file: "home.md",
    // @ts-expect-error Transforms cannot introduce markdown.
    schema: z.object({}).transform(() => ({ markdown: "replacement" })),
  });
  qino.defineItem({
    file: "home.json",
    // @ts-expect-error Transforms cannot introduce _meta.
    schema: z.object({}).transform(() => ({ _meta: {} })),
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    // @ts-expect-error A reserved key on any union branch is illegal.
    schema: z.union([z.object({ title: z.string() }), metaSchema]),
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    // @ts-expect-error A reserved key on any union branch is illegal.
    schema: z.union([z.object({ title: z.string() }), rawSchema]),
  });
  qino.defineItem({
    file: "home.json",
    // @ts-expect-error Explicit keys remain forbidden on catchall schemas.
    schema: metaSchema.catchall(z.unknown()),
  });
});

test("adds markdown and raw to Markdown entries, even with empty schemas", async () => {
  const schema = z.object({});
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "home.mdx", schema });
  expectTypeOf<
    Infer<typeof posts>["output"]["markdown"]
  >().toEqualTypeOf<string>();
  expectTypeOf((await posts.getEntry("hello")).raw).toEqualTypeOf<string>();
  expectTypeOf((await home.getEntry()).markdown).toEqualTypeOf<string>();
  expectTypeOf((await home.getEntry()).raw).toEqualTypeOf<string>();
  expectTypeOf(
    (await home.getEntry())._meta.filePath,
  ).toEqualTypeOf<`${string}.mdx`>();
});

test("empty schemas can derive fields from markdown and raw", async () => {
  const item = qino.defineItem({
    file: "home.md",
    schema: z.object({}),
    views: (view) => ({
      default: view({
        augment: ({ markdown }) => ({ words: markdown.length }),
      }),
    }),
  });
  expectTypeOf((await item.getEntry()).words).toEqualTypeOf<number>();
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({}),
    views: (view) => ({
      default: view({
        augment: ({ raw }) => ({ size: raw.length }),
        filter: (entry) => entry.size > 0,
      }),
    }),
  });
  expectTypeOf<
    Awaited<ReturnType<typeof posts.getEntries>>[number]["size"]
  >().toEqualTypeOf<number>();
});

test("allows nested names, JSON markdown, and erased schemas", async () => {
  const schema = z.object({
    title: z.string(),
    nested: z.object({
      _meta: z.string(),
      markdown: z.number(),
      raw: z.number(),
    }),
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
  });
  expectTypeOf(
    (await posts.getEntry("hello")).nested.markdown,
  ).toEqualTypeOf<number>();
  expectTypeOf(
    (await posts.getEntry("hello")).markdown,
  ).toEqualTypeOf<string>();
  // @ts-expect-error Qino does not generate body or provide an alias.
  expectTypeOf((await posts.getEntry("hello")).body);

  const json = qino.defineItem({
    file: "home.json",
    schema: z.object({ markdown: z.number(), raw: z.boolean() }),
  });
  expectTypeOf((await json.getEntry()).markdown).toEqualTypeOf<number>();
  expectTypeOf((await json.getEntry()).raw).toEqualTypeOf<boolean>();
  const plain = qino.defineItem({
    file: "plain.json",
    schema: z.object({ title: z.string() }),
  });
  // @ts-expect-error JSON has no automatic markdown.
  expectTypeOf((await plain.getEntry()).markdown);
  // @ts-expect-error JSON has no automatic raw.
  expectTypeOf((await plain.getEntry()).raw);

  const erased: ObjectSchema = schema;
  qino.defineItem({ file: "erased.md", schema: erased });
  qino.defineItem({
    file: "record.md",
    schema: z.record(z.string(), z.unknown()),
  });
});

test("body is available for user-defined fields in every format", async () => {
  const schema = z.object({ title: z.string(), body: z.number() });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "home.mdx", schema });
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  const json = qino.defineItem({ file: "home.json", schema });
  expectTypeOf((await posts.getEntry("hello")).body).toEqualTypeOf<number>();
  expectTypeOf((await home.getEntry()).body).toEqualTypeOf<number>();
  expectTypeOf((await docs.getEntry("intro")).body).toEqualTypeOf<number>();
  expectTypeOf((await json.getEntry()).body).toEqualTypeOf<number>();
});

test("resolved Markdown targets expose markdown in getters and view callbacks", async () => {
  const schema = z.object({ title: z.string() });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "home.mdx", schema });
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  const links = qino.defineItem({
    file: "links.json",
    schema: z.object({ post: z.string(), home: z.string(), doc: z.string() }),
    relations: { post: posts, home, doc: docs },
    views: (view) => ({
      default: view({
        resolveRelations: true,
        augment: (entry) => {
          expectTypeOf(entry.post.markdown).toEqualTypeOf<string>();
          expectTypeOf(entry.home.raw).toEqualTypeOf<string>();
          expectTypeOf(entry.doc.markdown).toEqualTypeOf<string>();
          return { length: entry.post.markdown.length };
        },
      }),
    }),
  });
  const entry = await links.getEntry();
  expectTypeOf(entry.length).toEqualTypeOf<number>();
  expectTypeOf(entry.post.markdown).toEqualTypeOf<string>();
  expectTypeOf(entry.home.raw).toEqualTypeOf<string>();
  expectTypeOf(entry.doc.markdown).toEqualTypeOf<string>();
});

test("augmentation cannot replace markdown or raw on Markdown entries", () => {
  qino.defineItem({
    file: "plain.md",
    schema: z.object({ title: z.string() }),
    views: (view) => ({
      default: view({}),
      markdown: view({
        // @ts-expect-error markdown cannot be added through augmentation.
        augment: () => ({ markdown: "replacement" }),
      }),
      raw: view({
        // @ts-expect-error raw cannot be added through augmentation.
        augment: () => ({ raw: "replacement" }),
      }),
    }),
  });
  qino.defineItem({
    file: "plain.json",
    schema: z.object({ title: z.string() }),
    views: (view) => ({
      default: view({
        augment: () => ({ markdown: "derived", raw: "derived" }),
      }),
    }),
  });
});
