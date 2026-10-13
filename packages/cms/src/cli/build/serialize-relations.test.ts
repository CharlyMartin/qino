import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { serializeRelations } from "./serialize-relations";

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const schema = z.object({ title: z.string() });

const authors = qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
});
const docs = qino.defineTree({
  directory: "docs",
  schema,
  extension: ".md",
  titleField: "title",
});
const home = qino.defineItem({ file: "pages/home.md", schema });

describe("serializeRelations", () => {
  test("returns an empty array without relations", () => {
    expect(serializeRelations({})).toEqual([]);
  });

  test("references targets by kind and id, sorted by path", () => {
    expect(
      serializeRelations({ page: home, author: authors, "docs[*]": docs }),
    ).toEqual([
      {
        path: "author",
        target: { kind: "collection", id: "authors" },
        cardinality: "one",
      },
      {
        path: "docs[*]",
        target: { kind: "tree", id: "docs" },
        cardinality: "many",
      },
      {
        path: "page",
        target: { kind: "item", id: "pages/home.md" },
        cardinality: "one",
      },
    ]);
  });

  test("resolves lazy targets", () => {
    expect(serializeRelations({ "meta.authors[*]": () => authors })).toEqual([
      {
        path: "meta.authors[*]",
        target: { kind: "collection", id: "authors" },
        cardinality: "many",
      },
    ]);
  });
});
