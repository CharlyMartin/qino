import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import type { CloudConfig } from "../../types/cloud";
import { serializePrimitiveCloud } from "./serialize-primitive-cloud";

const globalCloud: CloudConfig = {
  publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
};
const accepted = [{ type: "image/*", maxSize: "5MB" }] as const;
const acceptedBytes = [{ type: "image/*", maxSize: 5242880 }];
const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cloud: globalCloud,
});
const schema = z.object({ title: z.string(), tags: z.array(z.string()) });
const jsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
};

describe("serializePrimitiveCloud", () => {
  test("resolves defaults for a collection", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });

    expect(
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toEqual({
      searchableBy: [],
      sortableBy: [],
      media: { saveAs: "{id}/{name}-{hash}.{ext}" },
    });
  });

  test("keeps a collection's cloud config", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: {
        searchableBy: ["title", "tags"],
        sortableBy: ["title"],
        media: { saveAs: "blog/{name}.{ext}", accepted },
      },
    });

    expect(
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toEqual({
      searchableBy: ["title", "tags"],
      sortableBy: ["title"],
      media: { saveAs: "blog/{name}.{ext}", accepted: acceptedBytes },
    });
  });

  test("gives trees search and media, but no sort", () => {
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { searchableBy: ["title"] },
    });

    expect(
      serializePrimitiveCloud(docs, globalCloud, jsonSchema, "docs"),
    ).toEqual({
      searchableBy: ["title"],
      media: { saveAs: "{id}/{name}-{hash}.{ext}" },
    });
  });

  test("gives items media only", () => {
    const home = qino.defineItem({ file: "pages/home.md", schema });

    expect(
      serializePrimitiveCloud(home, globalCloud, jsonSchema, "pages/home.md"),
    ).toEqual({ media: { saveAs: "{id}/{name}-{hash}.{ext}" } });
  });

  test("inherits accepted media from initQino", () => {
    const home = qino.defineItem({ file: "pages/home.md", schema });

    expect(
      serializePrimitiveCloud(
        home,
        { ...globalCloud, media: { accepted } },
        jsonSchema,
        "pages/home.md",
      ).media,
    ).toEqual({ saveAs: "{id}/{name}-{hash}.{ext}", accepted: acceptedBytes });
  });

  test("keeps an empty accepted list, which disables uploads", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      cloud: { media: { accepted: [] } },
    });

    expect(
      serializePrimitiveCloud(
        home,
        { ...globalCloud, media: { accepted } },
        jsonSchema,
        "pages/home.md",
      ).media,
    ).toEqual({ saveAs: "{id}/{name}-{hash}.{ext}", accepted: [] });
  });

  test("validates media.saveAs", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { media: { saveAs: "{slug}.{ext}" } },
    });

    expect(() =>
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toThrow('unknown token "{slug}"');
  });

  test("validates accepted media", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { media: { accepted: [{ type: "png", maxSize: "50KB" }] } },
    });

    expect(() =>
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toThrow('media.accepted type "png" of "posts" isn\'t a MIME type');
  });

  test("validates sortable fields", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { sortableBy: ["title"] },
    });

    expect(() =>
      serializePrimitiveCloud(
        posts,
        globalCloud,
        { type: "object", properties: { title: { type: "array" } } },
        "posts",
      ),
    ).toThrow('sortableBy "title" of "posts" isn\'t a string');
  });
});
