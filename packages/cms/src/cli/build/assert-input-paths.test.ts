import { describe, expect, test } from "vitest";
import { z } from "zod";

import { QinoPrimitiveMarker } from "../../data/globals";
import { initQino } from "../../runtime/qino/init-qino";
import type { AnyPrimitive } from "../../types/utils";
import { assertInputPaths } from "./assert-input-paths";
import { serializeJsonSchema } from "./serialize-json-schema";

const qino = initQino({ contentFolder: "content", mediaFolder: "public" });
const authors = qino.defineCollection({
  directory: "authors",
  schema: z.object({ name: z.string() }),
  extension: ".json",
});

function assert(primitive: AnyPrimitive, id: string) {
  const jsonSchema = serializeJsonSchema(
    primitive[QinoPrimitiveMarker].schema,
    id,
  );
  return () => assertInputPaths(primitive, jsonSchema, id);
}

describe("assertInputPaths", () => {
  test("passes when relation paths exist in the input", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema: z.object({
        author: z.string(),
        meta: z.object({ editors: z.array(z.string()) }).optional(),
      }),
      extension: ".md",
      relations: { author: authors, "meta.editors[*]": () => authors },
    });

    expect(assert(posts, "posts")).not.toThrow();
  });

  test("throws when a transform renames a relation field", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema: z
        .object({ author_ref: z.string() })
        .transform(({ author_ref }) => ({ author: author_ref })),
      extension: ".md",
      relations: { author: authors },
    });

    expect(assert(posts, "posts")).toThrow(
      /Relation "author" of "posts" isn't a field of its schema input/,
    );
  });

  test("throws when a transform renames the titleField", () => {
    const docs = qino.defineTree({
      directory: "docs",
      schema: z
        .object({ page_title: z.string() })
        .transform(({ page_title }) => ({ title: page_title })),
      extension: ".md",
      titleField: "title",
    });

    expect(assert(docs, "docs")).toThrow(
      /titleField "title" of "docs" isn't a field of its schema input/,
    );
  });

  test("passes for a tree whose titleField exists in the input", () => {
    const docs = qino.defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      titleField: "title",
    });

    expect(assert(docs, "docs")).not.toThrow();
  });
});
