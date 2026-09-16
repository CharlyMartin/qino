import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

const schema = z
  .object({
    markdown: z.string(),
    title: z.string(),
  })
  .strict();

const collection = qino.defineCollection({
  views: (view) => ({
    default: view({
      augment: ({ markdown, _meta }) => ({
        stats: { wordCount: markdown.length },
        sourceFile: _meta.fileName,
      }),
    }),
  }),
  directory: "/posts",
  schema,
  extension: ".md",
});

const item = qino.defineItem({
  views: (view) => ({
    default: view({
      augment: ({ markdown }) => ({ stats: { wordCount: markdown.length } }),
    }),
  }),
  file: "/pages/home.md",
  schema,
});

const tree = qino.defineTree({
  views: (view) => ({
    default: view({
      augment: ({ markdown }) => ({ stats: { wordCount: markdown.length } }),
    }),
  }),
  directory: "/docs",
  schema,
  extension: ".md",
  titleField: "title",
});

describe("augment type behaviour", () => {
  test("infers fields returned by every hydrated primitive", async () => {
    const [post] = await collection.getMany();
    assert(post);
    const home = await item.getData();
    const doc = await tree.getEntry("intro");

    expectTypeOf(post.stats.wordCount).toEqualTypeOf<number>();
    expectTypeOf(post.sourceFile).toEqualTypeOf<`${string}.md`>();
    expectTypeOf(home.stats.wordCount).toEqualTypeOf<number>();
    expectTypeOf(doc.stats.wordCount).toEqualTypeOf<number>();
  });

  test("does not allow augmentations to overwrite entry fields", () => {
    qino.defineCollection({
      views: (view) => ({
        default: view({
          // @ts-expect-error Augmentations may only add fields.
          augment: () => ({ title: "Replacement" }),
        }),
      }),
      directory: "/invalid",
      schema,
      extension: ".md",
    });
  });

  test("does not allow augmentations to overwrite generated fields", () => {
    qino.defineItem({
      file: "/home.md",
      schema,
      views: (view) => ({
        default: view({}),
        markdown: view({
          // @ts-expect-error Markdown cannot be added or replaced by augmentation.
          augment: () => ({ markdown: "replacement" }),
        }),
        meta: view({
          // @ts-expect-error Metadata is already part of the entry.
          augment: () => ({ _meta: {} }),
        }),
      }),
    });
  });
});
