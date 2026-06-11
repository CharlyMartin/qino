import { describe, expect, test } from "vitest";
import { z } from "zod";

import type { GenericPath, SingletonFile } from "../../types";
import { createCollection } from "../collections/create-collection";
import { createSingleton } from "../singletons/create-singleton";
import { createTree } from "../trees/create-tree";
import { createPathRegistry } from "./create-path-registry";
import type { QinoContext } from "./create-qino";

const ctx: QinoContext = {
  instanceId: Symbol("test"),
  contentFolder: "content",
  mediaFolder: "media",
};

const Schema = z.object({ title: z.string() }).strict();

function collection(directory: GenericPath) {
  return createCollection(ctx, { directory, schema: Schema, extension: ".md" });
}

function tree(directory: GenericPath) {
  return createTree(ctx, {
    directory,
    schema: Schema,
    extension: ".md",
    titleField: "title",
  });
}

function singleton(file: SingletonFile) {
  return createSingleton(ctx, { file, schema: Schema });
}

describe("createPathRegistry", () => {
  test("registers disjoint primitives without throwing", () => {
    const registry = createPathRegistry();
    expect(() => {
      registry.register(collection("/authors"));
      registry.register(tree("/docs"));
      registry.register(singleton("/pages/home.md"));
    }).not.toThrow();
  });

  test("throws when a nested collection directory is registered", () => {
    const registry = createPathRegistry();
    registry.register(collection("/posts"));
    expect(() => registry.register(collection("/posts/featured"))).toThrow(
      /Collection directories overlap/,
    );
  });

  test("throws when a duplicate singleton file is registered", () => {
    const registry = createPathRegistry();
    registry.register(singleton("/settings.json"));
    expect(() => registry.register(singleton("/settings.json"))).toThrow(
      /Two singletons target the same file/,
    );
  });

  test("throws when a singleton file sits inside an existing tree directory", () => {
    const registry = createPathRegistry();
    registry.register(tree("/docs"));
    expect(() => registry.register(singleton("/docs/preamble.md"))).toThrow(
      /sits inside tree directory/,
    );
  });

  test("each registry is independent", () => {
    const a = createPathRegistry();
    const b = createPathRegistry();
    a.register(collection("/posts"));
    expect(() => b.register(collection("/posts"))).not.toThrow();
  });
});
