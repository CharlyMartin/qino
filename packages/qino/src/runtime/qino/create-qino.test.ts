import { describe, expect, test } from "vitest";
import { z } from "zod";

import { QinoPrimitiveMarker, QinoPrimitives } from "../../data";
import { createQino } from "./create-qino";

const Schema = z.object({ title: z.string() }).strict();

describe("createQino", () => {
  test("returns createCollection, createSingleton, createTree", () => {
    const qino = createQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    expect(typeof qino.createCollection).toBe("function");
    expect(typeof qino.createSingleton).toBe("function");
    expect(typeof qino.createTree).toBe("function");
  });

  test("stamps an instance id onto each primitive's QinoPrimitiveMarker", () => {
    const { createCollection, createSingleton, createTree } = createQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const singleton = createSingleton({
      file: "/pages/home.md",
      schema: Schema,
    });
    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(typeof collection[QinoPrimitiveMarker].instanceId).toBe("symbol");
    expect(collection[QinoPrimitiveMarker].is).toBe(QinoPrimitives.collection);
    expect(singleton[QinoPrimitiveMarker].is).toBe(QinoPrimitives.singleton);
    expect(tree[QinoPrimitiveMarker].is).toBe(QinoPrimitives.tree);
  });

  test("primitives from the same instance share the same instance id", () => {
    const { createCollection, createSingleton, createTree } = createQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const singleton = createSingleton({
      file: "/pages/home.md",
      schema: Schema,
    });
    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(collection[QinoPrimitiveMarker].instanceId).toBe(
      singleton[QinoPrimitiveMarker].instanceId,
    );
    expect(singleton[QinoPrimitiveMarker].instanceId).toBe(
      tree[QinoPrimitiveMarker].instanceId,
    );
  });

  test("primitives from different instances have different instance ids", () => {
    const a = createQino({ contentFolder: "a", mediaFolder: "p" });
    const b = createQino({ contentFolder: "b", mediaFolder: "p" });
    const ca = a.createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const cb = b.createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    expect(ca[QinoPrimitiveMarker].instanceId).not.toBe(
      cb[QinoPrimitiveMarker].instanceId,
    );
  });

  test("destructured creators still produce valid primitives", () => {
    const { createCollection } = createQino({
      contentFolder: "src/content",
      mediaFolder: "public",
    });
    const collection = createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    expect(collection[QinoPrimitiveMarker].is).toBe(QinoPrimitives.collection);
  });
});

describe("createQino definition reloads", () => {
  test("recreates a collection with updated metadata on the same instance", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.createCollection({
      directory: "/posts",
      extension: ".md",
      schema: Schema,
      resolveRelations: true,
    });
    const reloaded = qino.createCollection({
      directory: "/posts",
      extension: ".md",
      schema: UpdatedSchema,
      resolveRelations: false,
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

  test("recreates a singleton with updated metadata on the same instance", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.createSingleton({
      file: "/settings.json",
      schema: Schema,
      resolveRelations: true,
    });
    const reloaded = qino.createSingleton({
      file: "/settings.json",
      schema: UpdatedSchema,
      resolveRelations: false,
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
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    const UpdatedSchema = Schema.extend({ description: z.string() });
    const original = qino.createTree({
      directory: "/docs",
      extension: ".md",
      titleField: "title",
      schema: Schema,
      resolveRelations: true,
    });
    const reloaded = qino.createTree({
      directory: "/docs",
      extension: ".md",
      titleField: "title",
      schema: UpdatedSchema,
      resolveRelations: false,
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
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    qino.createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    const moved = qino.createCollection({
      directory: "/articles",
      schema: Schema,
      extension: ".md",
    });
    const replacement = qino.createTree({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    expect(moved[QinoPrimitiveMarker].directory).toBe("/articles");
    expect(replacement[QinoPrimitiveMarker].directory).toBe("/posts");
  });
});
