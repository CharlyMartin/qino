import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import type { CloudConfig } from "../../types/cloud";
import { serializePrimitive } from "./serialize-primitive";

const media = { saveAs: "{id}/{name}-{hash}.{ext}", fields: [] };
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
      body: null,
      schema: jsonSchema,
      relations: [],
      cloud: { hiddenFields: [], media },
    });
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
      titleField: "title",
      orderFileName: "_order.json",
      body: { format: "mdx" },
      schema: jsonSchema,
      relations: [],
      cloud: { searchableBy: [], hiddenFields: [], media },
    });
  });
});
