import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import type { CloudConfig } from "../../types/cloud";
import { serializePrimitiveCloud } from "./serialize-primitive-cloud";

const globalCloud: CloudConfig = {
  publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
};
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

    expect(serializePrimitiveCloud(posts, jsonSchema, "posts")).toEqual({
      searchableBy: [],
      sortableBy: [],
      hiddenFields: [],
      media: { saveFileAs: "{id}/{name}-{hash}" },
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
        media: { saveFileAs: "blog/{field}/{name}" },
      },
    });

    expect(serializePrimitiveCloud(posts, jsonSchema, "posts")).toEqual({
      searchableBy: ["title", "tags"],
      sortableBy: ["title"],
      hiddenFields: ["notes"],
      media: { saveFileAs: "blog/{field}/{name}" },
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

    expect(serializePrimitiveCloud(docs, jsonSchema, "docs")).toEqual({
      searchableBy: ["title"],
      hiddenFields: [],
      media: { saveFileAs: "{id}/{name}-{hash}" },
    });
  });

  test("gives items hidden fields and media only", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      cloud: { hiddenFields: ["notes"] },
    });

    expect(serializePrimitiveCloud(home, jsonSchema, "pages/home.md")).toEqual({
      hiddenFields: ["notes"],
      media: { saveFileAs: "{id}/{name}-{hash}" },
    });
  });

  test("validates cloud.media.saveFileAs", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { media: { saveFileAs: "{slug}" } },
    });

    expect(() => serializePrimitiveCloud(posts, jsonSchema, "posts")).toThrow(
      'unknown token "{slug}"',
    );
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
      serializePrimitiveCloud(home, jsonSchema, "pages/home.md"),
    ).toThrow('hiddenFields "title" of "pages/home.md" is required');
  });

  test("writes an entry saveAs for collections and trees", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { saveAs: "post-{title}" },
    });
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { saveAs: "{title}" },
    });

    expect(serializePrimitiveCloud(posts, jsonSchema, "posts")).toMatchObject({
      saveAs: "post-{title}",
    });
    expect(serializePrimitiveCloud(docs, jsonSchema, "docs")).toMatchObject({
      saveAs: "{title}",
    });
  });

  test("leaves saveAs out when unset", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });

    expect(
      serializePrimitiveCloud(posts, jsonSchema, "posts"),
    ).not.toHaveProperty("saveAs");
  });

  test("validates an entry saveAs", () => {
    const saveAs: string = "{notes}";
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { saveAs },
    });

    expect(() => serializePrimitiveCloud(posts, jsonSchema, "posts")).toThrow(
      'saveAs "{notes}" of "posts" uses "{notes}", which is optional',
    );
  });

  test("makes displayEntryAs optional", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { searchableBy: ["title"] },
    });
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      cloud: { hiddenFields: ["notes"] },
    });

    expect(() =>
      serializePrimitiveCloud(posts, jsonSchema, "posts"),
    ).not.toThrow();
    expect(() =>
      serializePrimitiveCloud(docs, jsonSchema, "docs"),
    ).not.toThrow();
    expect(() =>
      serializePrimitiveCloud(home, jsonSchema, "pages/home.md"),
    ).not.toThrow();
  });

  test("validates displayEntryAs, and leaves it out of cloud", () => {
    const displayEntryAs: string = "{notes}";
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { displayEntryAs },
    });
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { displayEntryAs: "{title}" },
    });

    expect(() => serializePrimitiveCloud(posts, jsonSchema, "posts")).toThrow(
      'displayEntryAs "{notes}" of "posts" uses "{notes}", which is optional',
    );
    expect(
      serializePrimitiveCloud(docs, jsonSchema, "docs"),
    ).not.toHaveProperty("displayEntryAs");
  });

  test("validates displayAs, and leaves it out of cloud", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      cloud: { displayAs: "Home: {title}" },
    });
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { displayAs: "Docs" },
    });

    expect(() =>
      serializePrimitiveCloud(home, jsonSchema, "pages/home.md"),
    ).toThrow(
      'displayAs "Home: {title}" of "pages/home.md" names the primitive, so it takes no {field}. Label entries with displayEntryAs.',
    );
    expect(
      serializePrimitiveCloud(docs, jsonSchema, "docs"),
    ).not.toHaveProperty("displayAs");
  });

  test("rejects displayEntryAs on an item", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      // @ts-expect-error an item is a single entry.
      cloud: { displayEntryAs: "{title}" },
    });

    expect(() =>
      serializePrimitiveCloud(home, jsonSchema, "pages/home.md"),
    ).toThrow(
      'displayEntryAs of "pages/home.md" labels entries, but an item is a single file. Name it with displayAs.',
    );
  });

  test("rejects an entry saveAs on an item", () => {
    const home = qino.defineItem({
      file: "pages/home.md",
      schema,
      // @ts-expect-error items are a single file.
      cloud: { saveAs: "{title}" },
    });

    expect(() =>
      serializePrimitiveCloud(home, jsonSchema, "pages/home.md"),
    ).toThrow(
      'saveAs of "pages/home.md" names new entries, but an item is a single file.',
    );
  });
});
