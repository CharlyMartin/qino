import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { serializePrimitives } from "./serialize-primitives";

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const schema = z.object({ title: z.string() });

describe("serializePrimitives", () => {
  test("returns an empty object without primitives", () => {
    expect(serializePrimitives([])).toEqual({});
  });

  test("keys primitives by id, sorted", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });
    const authors = qino.defineCollection({
      directory: "authors",
      schema,
      extension: ".json",
    });

    const serialized = serializePrimitives([posts, authors]);

    expect(Object.keys(serialized)).toEqual(["authors", "posts"]);
    expect(serialized.posts).toMatchObject({
      directory: "posts",
      extension: ".md",
    });
  });
});
