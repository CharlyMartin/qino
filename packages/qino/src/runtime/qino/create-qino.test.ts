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

describe("createQino path overlap detection", () => {
  test("allows primitives with disjoint paths", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    expect(() => {
      qino.createCollection({
        directory: "/authors",
        schema: Schema,
        extension: ".md",
      });
      qino.createTree({
        directory: "/docs",
        schema: Schema,
        extension: ".md",
        titleField: "title",
      });
      qino.createSingleton({ file: "/settings.json", schema: Schema });
    }).not.toThrow();
  });

  test("throws when a second collection nests inside the first", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    qino.createCollection({
      directory: "/posts",
      schema: Schema,
      extension: ".md",
    });
    expect(() =>
      qino.createCollection({
        directory: "/posts/featured",
        schema: Schema,
        extension: ".md",
      }),
    ).toThrow(/Collection directories overlap/);
  });

  test("throws when a singleton sits inside an existing tree", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    qino.createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });
    expect(() =>
      qino.createSingleton({ file: "/docs/preamble.md", schema: Schema }),
    ).toThrow(/sits inside tree directory/);
  });

  test("throws when a tree overlaps an existing collection", () => {
    const qino = createQino({ contentFolder: "c", mediaFolder: "p" });
    qino.createCollection({
      directory: "/docs/api",
      schema: Schema,
      extension: ".md",
    });
    expect(() =>
      qino.createTree({
        directory: "/docs",
        schema: Schema,
        extension: ".md",
        titleField: "title",
      }),
    ).toThrow(/overlaps with collection directory/);
  });

  test("separate instances do not share a registry", () => {
    const a = createQino({ contentFolder: "c", mediaFolder: "p" });
    const b = createQino({ contentFolder: "c", mediaFolder: "p" });
    a.createCollection({ directory: "/posts", schema: Schema, extension: ".md" });
    expect(() =>
      b.createCollection({
        directory: "/posts",
        schema: Schema,
        extension: ".md",
      }),
    ).not.toThrow();
  });
});
