import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

const schema = z
  .object({
    title: z.string(),
    body: z.string(),
  })
  .strict();

const collection = qino.createCollection({
  directory: "/posts",
  schema,
  extension: ".md",
  transform: ({ body, _meta }) => ({
    stats: { wordCount: body.length },
    sourceFile: _meta.fileName,
  }),
});

const singleton = qino.createSingleton({
  file: "/pages/home.md",
  schema,
  transform: ({ body }) => ({ stats: { wordCount: body.length } }),
});

const tree = qino.createTree({
  directory: "/docs",
  schema,
  extension: ".md",
  titleField: "title",
  transform: ({ body }) => ({ stats: { wordCount: body.length } }),
});

describe("transform type behaviour", () => {
  test("infers fields returned by every hydrated primitive", async () => {
    const [post] = await collection.getAll();
    const home = await singleton.getData();
    const doc = await tree.getEntry("intro");

    expectTypeOf(post.stats.wordCount).toEqualTypeOf<number>();
    expectTypeOf(post.sourceFile).toEqualTypeOf<`${string}.md`>();
    expectTypeOf(home.stats.wordCount).toEqualTypeOf<number>();
    expectTypeOf(doc.stats.wordCount).toEqualTypeOf<number>();
  });

  test("does not allow transforms to overwrite entry fields", () => {
    qino.createCollection({
      directory: "/invalid",
      schema,
      extension: ".md",
      // @ts-expect-error Transforms may only add fields.
      transform: () => ({ title: "Replacement" }),
    });
  });
});
