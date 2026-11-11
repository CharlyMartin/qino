import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { MediaParseContext, QinoImage } from "./media";
import type { RelationParseContext } from "./relations";

const qino = initQino({ contentFolder: "content", mediaFolder: "public" });
const authors = qino.defineCollection({
  directory: "authors",
  extension: ".md",
  schema: z.object({ name: z.string() }),
});

describe("parse callbacks", () => {
  test("type their arguments and leave entry types unchanged", async () => {
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({
        author: z.string(),
        cover: z.string(),
        attachment: z.string(),
      }),
      relations: {
        author: {
          target: authors,
          resolveDepth: 1,
          parse: (value, ctx) => {
            expectTypeOf(value).toEqualTypeOf<string>();
            expectTypeOf(ctx).toEqualTypeOf<RelationParseContext>();
            return ctx.target.is == "item" ? undefined : value;
          },
        },
      },
      media: {
        cover: {
          accepted: "image/webp",
          maxSize: "1MB",
          parse: (value, ctx) => {
            expectTypeOf(ctx).toEqualTypeOf<MediaParseContext>();
            return value;
          },
        },
        attachment: {
          accepted: "application/pdf",
          maxSize: "1MB",
          parse: () => undefined,
        },
      },
    });
    const post = await posts.getEntry("hello");
    expectTypeOf(post.author.name).toEqualTypeOf<string>();
    expectTypeOf(post.cover).toEqualTypeOf<QinoImage>();
    expectTypeOf(post.attachment).toEqualTypeOf<string>();
  });

  test("reject callbacks that return something other than a string", () => {
    qino.defineCollection({
      directory: "bad-posts",
      extension: ".md",
      schema: z.object({ author: z.string(), cover: z.string() }),
      relations: {
        // @ts-expect-error parse returns a string or undefined.
        author: { target: authors, parse: () => 1 },
      },
    });
  });

  test("type markdown.media rules' arguments", async () => {
    const posts = qino.defineCollection({
      directory: "body-posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      markdown: {
        stats: true,
        media: [
          {
            accepted: "image/png",
            maxSize: "1MB",
            parse: (value, ctx) => {
              expectTypeOf(value).toEqualTypeOf<string>();
              expectTypeOf(ctx).toEqualTypeOf<MediaParseContext>();
              return value.replace(/^\[\[(.+)\]\]$/u, "/$1");
            },
          },
          { accepted: "image/webp", maxSize: "1MB", parse: () => undefined },
        ],
      },
    });
    expectTypeOf((await posts.getEntry("a"))._stats.wordCount).toBeNumber();
  });

  test("reject markdown.media parse returning something else", () => {
    qino.defineCollection({
      directory: "bad-body-posts",
      extension: ".md",
      schema: z.object({ title: z.string() }),
      markdown: {
        // @ts-expect-error parse returns a string or undefined.
        media: { accepted: "image/png", maxSize: "1MB", parse: () => 1 },
      },
    });
  });
});
