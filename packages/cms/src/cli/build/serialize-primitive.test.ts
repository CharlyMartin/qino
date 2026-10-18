import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import type { CloudConfig } from "../../types/cloud";
import { serializePrimitive } from "./serialize-primitive";

const media = { saveAs: "{id}/{name}-{hash}", fields: [] };
const cloud: CloudConfig = {
  publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
};
const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const schema = z.object({ title: z.string() });
const jsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: { title: { type: "string" } },
  required: ["title"],
};

const authors = qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
});

describe("serializePrimitive", () => {
  test("serializes a collection", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string(), author: z.string() }),
      extension: ".md",
      relations: { author: authors },
      views: (view) => ({ default: view({ resolveRelations: true }) }),
    });

    expect(serializePrimitive(posts, cloud)).toEqual({
      directory: "posts",
      extension: ".md",
      displayAs: "posts",
      body: { format: "markdown" },
      schema: {
        ...jsonSchema,
        properties: { title: { type: "string" }, author: { type: "string" } },
        required: ["title", "author"],
      },
      relations: [
        {
          path: "author",
          target: { kind: "collection", id: "authors" },
          cardinality: "one",
        },
      ],
      cloud: { searchableBy: [], sortableBy: [], hiddenFields: [], media },
    });
  });

  test("serializes an item", () => {
    const home = qino.defineItem({ file: "pages/home.json", schema });

    expect(serializePrimitive(home, cloud)).toEqual({
      file: "pages/home.json",
      extension: ".json",
      displayAs: "pages/home.json",
      body: null,
      schema: jsonSchema,
      relations: [],
      cloud: { hiddenFields: [], media },
    });
  });

  test("writes displayAs and displayEntryAs top-level", () => {
    const qinoCloud = initQino({
      contentFolder: "content",
      mediaFolder: "public",
      cloud,
    });
    const posts = qinoCloud.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      cloud: { displayAs: "Blog posts", displayEntryAs: "{title}" },
    });
    const home = qinoCloud.defineItem({
      file: "pages/home.json",
      schema,
      cloud: { displayAs: "Home page" },
    });
    const docs = qinoCloud.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
      cloud: { displayAs: "Docs", displayEntryAs: "{title}!" },
    });

    expect(serializePrimitive(posts, cloud)).toMatchObject({
      displayAs: "Blog posts",
      displayEntryAs: "{title}",
    });
    expect(serializePrimitive(home, cloud)).toMatchObject({
      displayAs: "Home page",
    });
    expect(serializePrimitive(docs, cloud)).toMatchObject({
      displayAs: "Docs",
      displayEntryAs: "{title}!",
      titleField: "title",
    });
    expect(serializePrimitive(posts, cloud).cloud).toEqual({
      searchableBy: [],
      sortableBy: [],
      hiddenFields: [],
      media,
    });
  });

  test("leaves displayEntryAs out of collections when unset", () => {
    expect(serializePrimitive(authors, cloud)).not.toHaveProperty(
      "displayEntryAs",
    );
  });

  test("serializes a tree", () => {
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".mdx",
      titleField: "title",
    });

    expect(serializePrimitive(docs, cloud)).toEqual({
      directory: "docs",
      extension: ".mdx",
      displayAs: "docs",
      displayEntryAs: "{title}",
      titleField: "title",
      orderFileName: "_order.json",
      body: { format: "mdx" },
      schema: jsonSchema,
      relations: [],
      cloud: { searchableBy: [], hiddenFields: [], media },
    });
  });
});
