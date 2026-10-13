import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { getMappedFields } from "./get-mapped-fields";

const qino = initQino({ contentFolder: "content", mediaFolder: "public" });
const schema = z.object({ title: z.string(), authors: z.array(z.string()) });
const authors = qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
});

describe("getMappedFields", () => {
  test("lists relation paths", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      relations: { "authors[*]": authors },
    });

    expect(getMappedFields(posts)).toEqual([
      {
        label: 'Relation "authors[*]"',
        segments: [{ kind: "key", name: "authors" }, { kind: "array" }],
      },
    ]);
  });

  test("lists lazy relation paths without resolving their targets", () => {
    const target = vi.fn(() => authors);
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      relations: { "authors[*]": target },
    });

    expect(getMappedFields(posts)).toEqual([
      {
        label: 'Relation "authors[*]"',
        segments: [{ kind: "key", name: "authors" }, { kind: "array" }],
      },
    ]);
    expect(target).not.toHaveBeenCalled();
  });

  test("skips undefined relation declarations", () => {
    const posts = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
      relations: { "authors[*]": undefined },
    });

    expect(getMappedFields(posts)).toEqual([]);
  });

  test("adds titleField for trees", () => {
    const docs = qino.defineTree({
      directory: "docs",
      schema,
      extension: ".md",
      titleField: "title",
    });

    expect(getMappedFields(docs)).toEqual([
      {
        label: 'titleField "title"',
        segments: [{ kind: "key", name: "title" }],
      },
    ]);
  });

  test("returns nothing without relations", () => {
    expect(getMappedFields(authors)).toEqual([]);
  });
});
