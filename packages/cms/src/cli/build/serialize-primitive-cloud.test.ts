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
const schema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
  image: z.string().optional(),
  notes: z.string().optional(),
});
const jsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    image: { type: "string" },
    notes: { type: "string" },
  },
  required: ["title", "tags"],
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
      hiddenFields: [],
      media: { saveAs: "{id}/{name}-{hash}.{ext}", fields: [] },
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
        hiddenFields: ["notes"],
        media: { saveAs: "blog/{name}.{ext}", fields: ["image"], accepted },
      },
    });

    expect(
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toEqual({
      searchableBy: ["title", "tags"],
      sortableBy: ["title"],
      hiddenFields: ["notes"],
      media: {
        saveAs: "blog/{name}.{ext}",
        fields: ["image"],
        accepted: acceptedBytes,
      },
    });
  });

  test("gives trees search, hidden fields, and media, but no sort", () => {
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
      hiddenFields: [],
      media: { saveAs: "{id}/{name}-{hash}.{ext}", fields: [] },
    });
  });

  test("gives items hidden fields and media only", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      cloud: { hiddenFields: ["notes"], media: { fields: ["image"] } },
    });

    expect(
      serializePrimitiveCloud(home, globalCloud, jsonSchema, "pages/home.md"),
    ).toEqual({
      hiddenFields: ["notes"],
      media: { saveAs: "{id}/{name}-{hash}.{ext}", fields: ["image"] },
    });
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
    ).toEqual({
      saveAs: "{id}/{name}-{hash}.{ext}",
      fields: [],
      accepted: acceptedBytes,
    });
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
    ).toEqual({ saveAs: "{id}/{name}-{hash}.{ext}", fields: [], accepted: [] });
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

  test("validates hidden fields", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      // @ts-expect-error "title" is required.
      cloud: { hiddenFields: ["title"] },
    });

    expect(() =>
      serializePrimitiveCloud(home, globalCloud, jsonSchema, "pages/home.md"),
    ).toThrow('hiddenFields "title" of "pages/home.md" is required');
  });

  test("validates media fields against relations", () => {
    const authors = qino.defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
    });
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      relations: { image: authors },
      cloud: { media: { fields: ["image"] } },
    });

    expect(() =>
      serializePrimitiveCloud(posts, globalCloud, jsonSchema, "posts"),
    ).toThrow('media.fields "image" of "posts" is also a relation');
  });
});
