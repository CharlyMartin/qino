import { createQino, type Infer } from "qino";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import type { ObjectSchema } from "./schema";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const metaSchema = z.object({
  title: z.string(),
  _meta: z.string().optional(),
});
const markdownSchema = z.object({
  title: z.string(),
  markdown: z.string().optional(),
});

test("rejects optional reserved declarations on all three primitives", () => {
  qino.defineCollection({
    directory: "/posts",
    extension: ".json",
    // @ts-expect-error _meta is reserved in JSON as well as Markdown.
    schema: metaSchema,
  });
  qino.defineItem({
    file: "/home.md",
    // @ts-expect-error _meta is reserved.
    schema: metaSchema,
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".mdx",
    titleField: "title",
    // @ts-expect-error _meta is reserved.
    schema: metaSchema,
  });
  qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema: markdownSchema,
  });
  qino.defineItem({
    file: "/home.mdx",
    schema: markdownSchema,
  });
  qino.defineTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema: markdownSchema,
  });
});

test("checks schema inputs, transformed outputs, and union branches", () => {
  qino.defineItem({
    file: "/home.md",
    schema: markdownSchema.transform(({ title }) => ({ title })),
  });
  qino.defineItem({
    file: "/home.md",
    schema: z.object({}).transform(() => ({ markdown: "replacement" })),
  });
  qino.defineItem({
    file: "/home.json",
    // @ts-expect-error Transforms cannot introduce _meta.
    schema: z.object({}).transform(() => ({ _meta: {} })),
  });
  qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    // @ts-expect-error A reserved key on any union branch is illegal.
    schema: z.union([z.object({ title: z.string() }), metaSchema]),
  });
  qino.defineItem({
    file: "/home.json",
    // @ts-expect-error Explicit keys remain forbidden on catchall schemas.
    schema: metaSchema.catchall(z.unknown()),
  });
});

test("allows nested names, JSON markdown, and erased schemas", async () => {
  const schema = z.object({
    title: z.string(),
    markdown: z.string(),
    nested: z.object({ _meta: z.string(), markdown: z.number() }),
  });
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "/home.mdx", schema });
  const docs = qino.defineTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  expectTypeOf<
    Infer<typeof posts>["output"]["markdown"]
  >().toEqualTypeOf<string>();
  expectTypeOf((await home.getData()).markdown).toEqualTypeOf<string>();
  expectTypeOf((await docs.getEntry("intro")).markdown).toEqualTypeOf<string>();
  // @ts-expect-error Qino no longer generates body or provides an alias.
  expectTypeOf((await home.getData()).body);
  expectTypeOf(
    (await posts.getOne("hello")).nested.markdown,
  ).toEqualTypeOf<number>();

  const json = qino.defineItem({
    file: "/home.json",
    schema: z.object({ markdown: z.number() }),
  });
  expectTypeOf((await json.getData()).markdown).toEqualTypeOf<number>();
  const plain = qino.defineItem({
    file: "/plain.json",
    schema: z.object({ title: z.string() }),
  });
  // @ts-expect-error JSON has no automatic markdown.
  expectTypeOf((await plain.getData()).markdown);

  const erased: ObjectSchema = schema;
  qino.defineItem({ file: "/erased.md", schema: erased });
  qino.defineItem({
    file: "/record.md",
    schema: z.record(z.string(), z.unknown()),
  });
});

test("body is available for user-defined fields in every format", async () => {
  const schema = z.object({ title: z.string(), body: z.number() });
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "/home.mdx", schema });
  const docs = qino.defineTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  const json = qino.defineItem({ file: "/home.json", schema });
  expectTypeOf((await posts.getOne("hello")).body).toEqualTypeOf<number>();
  expectTypeOf((await home.getData()).body).toEqualTypeOf<number>();
  expectTypeOf((await docs.getEntry("intro")).body).toEqualTypeOf<number>();
  expectTypeOf((await json.getData()).body).toEqualTypeOf<number>();
});

test("resolved Markdown targets expose markdown in getters and view callbacks", async () => {
  const schema = z.object({ title: z.string(), markdown: z.string() });
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "/home.mdx", schema });
  const docs = qino.defineTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  const links = qino.defineItem({
    file: "/links.json",
    schema: z.object({ post: z.string(), home: z.string(), doc: z.string() }),
    relations: { post: posts, home, doc: docs },
    views: (view) => ({
      default: view({
        resolveRelations: true,
        augment: (entry) => {
          expectTypeOf(entry.post.markdown).toEqualTypeOf<string>();
          expectTypeOf(entry.home.markdown).toEqualTypeOf<string>();
          expectTypeOf(entry.doc.markdown).toEqualTypeOf<string>();
          return { length: entry.post.markdown.length };
        },
      }),
    }),
  });
  const entry = await links.getData();
  expectTypeOf(entry.post.markdown).toEqualTypeOf<string>();
  expectTypeOf(entry.home.markdown).toEqualTypeOf<string>();
  expectTypeOf(entry.doc.markdown).toEqualTypeOf<string>();
});

test("markdown output follows schema transformations and omission", async () => {
  const schema = z.object({
    title: z.string(),
    markdown: z.string().transform((text) => text.length),
  });
  const item = qino.defineItem({ file: "/home.md", schema });
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".mdx",
    schema,
  });
  const docs = qino.defineTree({
    directory: "/docs",
    extension: ".markdown",
    titleField: "title",
    schema,
  });
  expectTypeOf((await item.getData()).markdown).toEqualTypeOf<number>();
  expectTypeOf<
    Infer<typeof item>["output"]["markdown"]
  >().toEqualTypeOf<number>();
  expectTypeOf((await posts.getOne("hello")).markdown).toEqualTypeOf<number>();
  expectTypeOf((await docs.getEntry("hello")).markdown).toEqualTypeOf<number>();
  const link = qino.defineItem({
    file: "/link.json",
    schema: z.object({ target: z.string() }),
    relations: { target: item },
    views: (view) => ({
      default: view({
        resolveRelations: true,
        augment: (entry) => {
          expectTypeOf(entry.target.markdown).toEqualTypeOf<number>();
          return { length: entry.target.markdown };
        },
      }),
    }),
  });
  expectTypeOf((await link.getData()).target.markdown).toEqualTypeOf<number>();
  const plain = qino.defineItem({
    file: "/plain.md",
    schema: z.object({ title: z.string() }),
    views: (view) => ({
      default: view({}),
      forbidden: view({
        // @ts-expect-error markdown cannot be added through augmentation.
        augment: () => ({ markdown: "replacement" }),
      }),
    }),
  });
  // @ts-expect-error An undeclared markdown field is absent from schema output.
  expectTypeOf((await plain.getData()).markdown);
});
