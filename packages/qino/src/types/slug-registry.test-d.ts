import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { createQino } from "../runtime/qino/create-qino";

// Simulates what `qino build` generates into `qino/_generated/types.d.ts`.
declare module "qino" {
  interface QinoSlugRegistry {
    "/typed-posts": "hello-world" | "second-post";
    "/typed-guides": "intro" | "advanced";
  }
}

const { createCollection, createTree } = createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const Schema = z.object({ title: z.string() }).strict();

const typedPosts = createCollection({
  directory: "/typed-posts",
  schema: Schema,
  extension: ".md",
});

const untypedPosts = createCollection({
  directory: "/untyped-posts",
  schema: Schema,
  extension: ".md",
});

const typedGuides = createTree({
  directory: "/typed-guides",
  schema: Schema,
  extension: ".md",
  titleField: "title",
});

describe("typed slugs", () => {
  test("a registered collection narrows getOne's slug to the union", () => {
    expectTypeOf(typedPosts.getOne)
      .parameter(0)
      .toEqualTypeOf<"hello-world" | "second-post">();
  });

  test("an unregistered directory falls back to string (back-compat)", () => {
    expectTypeOf(untypedPosts.getOne).parameter(0).toEqualTypeOf<string>();
  });

  test("a registered tree narrows every slug-taking getter", () => {
    expectTypeOf(typedGuides.getEntry)
      .parameter(0)
      .toEqualTypeOf<"intro" | "advanced">();
    expectTypeOf(typedGuides.getNextNode)
      .parameter(0)
      .toEqualTypeOf<"intro" | "advanced">();
    expectTypeOf(typedGuides.getPreviousNode)
      .parameter(0)
      .toEqualTypeOf<"intro" | "advanced">();
  });
});
