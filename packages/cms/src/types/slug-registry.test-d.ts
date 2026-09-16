import { createQino } from "@qino/cms";
import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

// Simulates what `qino build` generates into `qino/_generated/types.d.ts`.
declare module "@qino/cms" {
  interface QinoSlugRegistry {
    "/typed-posts": "hello-world" | "second-post";
    "/typed-guides": "intro" | "advanced";
  }
}

const { defineCollection, defineTree } = createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const Schema = z.object({ title: z.string() }).strict();

const typedPosts = defineCollection({
  directory: "/typed-posts",
  schema: Schema,
  extension: ".md",
});

const untypedPosts = defineCollection({
  directory: "/untyped-posts",
  schema: Schema,
  extension: ".md",
});

const typedGuides = defineTree({
  directory: "/typed-guides",
  schema: Schema,
  extension: ".md",
  titleField: "title",
});

describe("typed slugs", () => {
  test("getAllSlugs returns the registered slug union without parameters", () => {
    expectTypeOf(typedPosts.getAllSlugs).parameters.toEqualTypeOf<[]>();
    expectTypeOf(typedPosts.getAllSlugs).returns.toEqualTypeOf<
      Promise<Array<"hello-world" | "second-post">>
    >();
  });

  test("getAllSlugs falls back to string for an unregistered directory", () => {
    expectTypeOf(untypedPosts.getAllSlugs).returns.toEqualTypeOf<
      Promise<Array<string>>
    >();
  });

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
