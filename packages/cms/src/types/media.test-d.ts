import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { Infer } from "./infer";
import type { MediaSize, QinoImage } from "./media";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const AuthorSchema = z.object({ name: z.string(), avatar: z.string() });

const authorCollection = defineCollection({
  directory: "authors",
  schema: AuthorSchema,
  extension: ".json",
  media: { avatar: { accepted: "image/png", maxSize: "1MB" } },
});

const PostSchema = z.object({
  title: z.string(),
  cover: z.string(),
  thumbnail: z.string().nullable(),
  banner: z.string().optional(),
  attachment: z.string(),
  gallery: z.array(z.string()),
  seo: z.object({ image: z.string(), description: z.string() }),
  author: z.string(),
});

const postCollection = defineCollection({
  directory: "posts",
  schema: PostSchema,
  extension: ".md",
  relations: { author: authorCollection },
  media: {
    cover: { accepted: "image/webp", maxSize: "5MB" },
    thumbnail: { accepted: "image/jpeg", maxSize: "1MB" },
    banner: { accepted: "image/avif", maxSize: "1MB" },
    attachment: { accepted: "application/pdf", maxSize: "10MB" },
    "gallery[*]": { accepted: "image/png", maxSize: "5MB" },
    "seo.image": { accepted: "image/png", maxSize: "1MB" },
    markdown: [
      { accepted: "image/webp", maxSize: "1MB" },
      { accepted: "image/png", maxSize: "1MB" },
    ],
  },
  views: (view) => ({
    default: view({}),
    resolved: view({
      resolveRelations: 1,
      augment: (post) => {
        expectTypeOf(post.cover).toEqualTypeOf<QinoImage>();
        expectTypeOf(post.author.avatar).toEqualTypeOf<QinoImage>();
        return { coverWidth: post.cover.width };
      },
    }),
  }),
});

type Post = Infer<typeof postCollection>["output"];

describe("image fields", () => {
  test("become QinoImage", () => {
    expectTypeOf<Post["cover"]>().toEqualTypeOf<QinoImage>();
    expectTypeOf<Post["gallery"]>().toEqualTypeOf<Array<QinoImage>>();
    expectTypeOf<Post["seo"]["image"]>().toEqualTypeOf<QinoImage>();
    expectTypeOf<Post["seo"]["description"]>().toEqualTypeOf<string>();
  });

  test("keep null and optional", () => {
    expectTypeOf<Post["thumbnail"]>().toEqualTypeOf<QinoImage | null>();
    expectTypeOf<Post["banner"]>().toEqualTypeOf<QinoImage | undefined>();
  });

  test("leave other media fields as strings", () => {
    expectTypeOf<Post["attachment"]>().toEqualTypeOf<string>();
    expectTypeOf<Post["title"]>().toEqualTypeOf<string>();
  });

  test("apply to getters and related entries", async () => {
    const post = await postCollection.getEntry("hello");
    expectTypeOf(post.cover).toEqualTypeOf<QinoImage>();
    expectTypeOf(post.author).toEqualTypeOf<string>();

    const resolved = await postCollection.getEntry("hello", {
      view: "resolved",
    });
    expectTypeOf(resolved.author.avatar).toEqualTypeOf<QinoImage>();
    expectTypeOf(resolved.coverWidth).toEqualTypeOf<number>();
  });

  test("apply to items and trees", async () => {
    const home = defineItem({
      file: "home.json",
      schema: z.object({ hero: z.string() }),
      media: { hero: { accepted: "image/webp", maxSize: "5MB" } },
    });
    const docs = defineTree({
      directory: "docs",
      schema: z.object({ title: z.string(), icon: z.string() }),
      extension: ".mdx",
      titleField: "title",
      media: { icon: { accepted: "image/svg+xml", maxSize: "50KB" } },
    });

    expectTypeOf((await home.getEntry()).hero).toEqualTypeOf<QinoImage>();
    expectTypeOf((await docs.getEntry("a")).icon).toEqualTypeOf<QinoImage>();
  });

  test("leave entries untouched without media", async () => {
    const plain = defineCollection({
      directory: "plain",
      schema: z.object({ cover: z.string() }),
      extension: ".json",
    });
    expectTypeOf((await plain.getEntry("a")).cover).toEqualTypeOf<string>();
  });
});

describe("media config", () => {
  test("rejects unknown paths", () => {
    defineCollection({
      directory: "posts",
      schema: PostSchema,
      extension: ".md",
      media: {
        cover: { accepted: "image/webp", maxSize: "5MB" },
        // @ts-expect-error Not a path to a string field.
        covr: { accepted: "image/webp", maxSize: "5MB" },
      },
    });
  });

  test("rejects markdown on JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: AuthorSchema,
      extension: ".json",
      media: {
        avatar: { accepted: "image/png", maxSize: "1MB" },
        // @ts-expect-error JSON files have no Markdown body.
        markdown: [{ accepted: "image/png", maxSize: "1MB" }],
      },
    });
    defineItem({
      file: "home.json",
      schema: z.object({ hero: z.string() }),
      media: {
        // @ts-expect-error JSON files have no Markdown body.
        markdown: [{ accepted: "image/png", maxSize: "1MB" }],
      },
    });
    defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".json",
      titleField: "title",
      media: {
        // @ts-expect-error JSON files have no Markdown body.
        markdown: [{ accepted: "image/png", maxSize: "1MB" }],
      },
    });
    defineItem({
      file: "about.mdx",
      schema: z.object({ title: z.string() }),
      media: { markdown: [{ accepted: "image/png", maxSize: "1MB" }] },
    });
  });

  test("rejects several types in one rule", () => {
    defineCollection({
      directory: "posts",
      schema: PostSchema,
      extension: ".md",
      media: {
        markdown: [
          // @ts-expect-error A rule accepts one MIME type.
          { accepted: ["image/png", "image/jpeg"], maxSize: "5MB" },
        ],
      },
    });
  });

  test("rejects arrays on fields and invalid sizes", () => {
    defineCollection({
      directory: "posts",
      schema: PostSchema,
      extension: ".md",
      media: {
        // @ts-expect-error A field accepts one MIME type.
        cover: { accepted: ["image/webp"], maxSize: "5MB" },
      },
    });
    defineCollection({
      directory: "posts",
      schema: PostSchema,
      extension: ".md",
      media: {
        // @ts-expect-error Sizes are 50–950KB in steps of 50, or 1–100MB.
        cover: { accepted: "image/webp", maxSize: "1.5MB" },
      },
    });
  });
});

test("types media fields as paths to strings", () => {
  const withMedia = z.object({
    title: z.string(),
    views: z.number(),
    image: z.string().optional(),
    gallery: z.array(z.string()),
    seo: z.object({ image: z.string() }),
  });

  defineCollection({
    directory: "posts",
    extension: ".md",
    schema: withMedia,
    media: {
      image: { accepted: "image/webp", maxSize: "5MB" },
      "gallery[*]": { accepted: "image/webp", maxSize: "5MB" },
      "seo.image": { accepted: "image/webp", maxSize: "5MB" },
    },
  });
  defineItem({
    file: "pages/home.md",
    schema: withMedia,
    media: { "seo.image": { accepted: "image/webp", maxSize: "5MB" } },
  });
  defineCollection({
    directory: "posts",
    extension: ".md",
    schema: withMedia,
    media: {
      // @ts-expect-error "views" isn't a string.
      views: { accepted: "image/webp", maxSize: "5MB" },
    },
  });
  defineCollection({
    directory: "posts",
    extension: ".md",
    schema: withMedia,
    media: {
      // @ts-expect-error "gallery" is an array, use "gallery[*]".
      gallery: { accepted: "image/webp", maxSize: "5MB" },
    },
  });
});

test("types maxSize as 50–950KB in steps of 50, or 1–100MB", () => {
  const sizes: Array<MediaSize> = ["50KB", "950KB", "1MB", "100MB"];
  expectTypeOf(sizes).toEqualTypeOf<Array<MediaSize>>();

  // @ts-expect-error plain numbers aren't sizes.
  const bytes: MediaSize = 5000;
  // @ts-expect-error B isn't a unit.
  const byteUnit: MediaSize = "1B";
  // @ts-expect-error KB goes in steps of 50.
  const offStep: MediaSize = "25KB";
  // @ts-expect-error KB tops out at 950.
  const tooManyKilobytes: MediaSize = "999KB";
  // @ts-expect-error MB tops out at 100.
  const tooManyMegabytes: MediaSize = "101MB";
  // @ts-expect-error sizes are whole numbers.
  const decimal: MediaSize = "1.5MB";
  // @ts-expect-error units are uppercase.
  const lowercase: MediaSize = "5mb";
  // @ts-expect-error no space between number and unit.
  const spaced: MediaSize = "5 MB";
  // @ts-expect-error GB isn't a unit.
  const gigabytes: MediaSize = "1GB";

  expectTypeOf([
    bytes,
    byteUnit,
    offStep,
    tooManyKilobytes,
    tooManyMegabytes,
    decimal,
    lowercase,
    spaced,
    gigabytes,
  ]).toBeArray();
});
