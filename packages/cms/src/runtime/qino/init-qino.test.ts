import { describe, expect, test } from "vitest";
import { z } from "zod";

import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import { initQino } from "./init-qino";

const Schema = z.object({ title: z.string() }).strict();

describe("initQino", () => {
  test("returns defineCollection, defineItem, defineTree", () => {
    const qino = initQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    expect(typeof qino.defineCollection).toBe("function");
    expect(typeof qino.defineItem).toBe("function");
    expect(typeof qino.defineTree).toBe("function");
  });

  test("stamps an instance id onto each primitive's QinoPrimitiveMarker", () => {
    const { defineCollection, defineItem, defineTree } = initQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const item = defineItem({
      file: "/pages/home.md",
      schema: Schema,
    });
    const tree = defineTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(typeof collection[QinoPrimitiveMarker].instanceId).toBe("symbol");
    expect(collection[QinoPrimitiveMarker].is).toBe(QinoPrimitives.collection);
    expect(item[QinoPrimitiveMarker].is).toBe(QinoPrimitives.item);
    expect(tree[QinoPrimitiveMarker].is).toBe(QinoPrimitives.tree);
  });

  test("primitives from the same instance share the same instance id", () => {
    const { defineCollection, defineItem, defineTree } = initQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const item = defineItem({
      file: "/pages/home.md",
      schema: Schema,
    });
    const tree = defineTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(collection[QinoPrimitiveMarker].instanceId).toBe(
      item[QinoPrimitiveMarker].instanceId,
    );
    expect(item[QinoPrimitiveMarker].instanceId).toBe(
      tree[QinoPrimitiveMarker].instanceId,
    );
  });

  test("primitives from different instances have different instance ids", () => {
    const a = initQino({ contentFolder: "a", mediaFolder: "p" });
    const b = initQino({ contentFolder: "b", mediaFolder: "p" });
    const ca = a.defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const cb = b.defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    expect(ca[QinoPrimitiveMarker].instanceId).not.toBe(
      cb[QinoPrimitiveMarker].instanceId,
    );
  });

  test("destructured definition helpers still produce valid primitives", () => {
    const { defineCollection } = initQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    expect(collection[QinoPrimitiveMarker].is).toBe(QinoPrimitives.collection);
  });
});

describe("initQino definition reloads", () => {
  test("recreates a collection with updated metadata on the same instance", () => {
    const qino = initQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.defineCollection({
      views: (view) => ({
        default: view({
          resolveRelations: true,
        }),
      }),
      directory: "/posts",
      extension: ".md",
      schema: Schema,
    });
    const reloaded = qino.defineCollection({
      views: (view) => ({
        default: view({
          resolveRelations: false,
        }),
      }),
      directory: "/posts",
      extension: ".md",
      schema: UpdatedSchema,
    });
    const before = original[QinoPrimitiveMarker];
    const after = reloaded[QinoPrimitiveMarker];

    expect(reloaded).not.toBe(original);
    expect(after.instanceId).toBe(before.instanceId);
    expect(after.schema).toBe(UpdatedSchema);
    expect(after.resolveRelations).toBe(false);
    expect(before.schema).toBe(Schema);
    expect(before.resolveRelations).toBe(true);
  });

  test("recreates an item with updated metadata on the same instance", () => {
    const qino = initQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.defineItem({
      views: (view) => ({
        default: view({
          resolveRelations: true,
        }),
      }),
      file: "/settings.json",
      schema: Schema,
    });
    const reloaded = qino.defineItem({
      views: (view) => ({
        default: view({
          resolveRelations: false,
        }),
      }),
      file: "/settings.json",
      schema: UpdatedSchema,
    });
    const before = original[QinoPrimitiveMarker];
    const after = reloaded[QinoPrimitiveMarker];

    expect(reloaded).not.toBe(original);
    expect(after.instanceId).toBe(before.instanceId);
    expect(after.schema).toBe(UpdatedSchema);
    expect(after.resolveRelations).toBe(false);
    expect(before.schema).toBe(Schema);
    expect(before.resolveRelations).toBe(true);
  });

  test("recreates a tree with updated metadata on the same instance", () => {
    const qino = initQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.defineTree({
      views: (view) => ({
        default: view({
          resolveRelations: true,
        }),
      }),
      directory: "/docs",
      extension: ".md",
      titleField: "title",
      schema: Schema,
    });
    const reloaded = qino.defineTree({
      views: (view) => ({
        default: view({
          resolveRelations: false,
        }),
      }),
      directory: "/docs",
      extension: ".md",
      titleField: "title",
      schema: UpdatedSchema,
    });
    const before = original[QinoPrimitiveMarker];
    const after = reloaded[QinoPrimitiveMarker];

    expect(reloaded).not.toBe(original);
    expect(after.instanceId).toBe(before.instanceId);
    expect(after.schema).toBe(UpdatedSchema);
    expect(after.resolveRelations).toBe(false);
    expect(before.schema).toBe(Schema);
    expect(before.resolveRelations).toBe(true);
  });

  test("allows a directory change and reuse of the previous directory", () => {
    const qino = initQino({ contentFolder: "c", mediaFolder: "p" });
    qino.defineCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const moved = qino.defineCollection({
      directory: "/articles",
      schema: Schema,
      extension: ".md",
    });
    const replacement = qino.defineTree({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(moved[QinoPrimitiveMarker].directory).toBe("/articles");
    expect(replacement[QinoPrimitiveMarker].directory).toBe("/posts");
  });
});
