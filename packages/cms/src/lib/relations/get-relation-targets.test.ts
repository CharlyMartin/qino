import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { getRelationTargets } from "./get-relation-targets";

const qino = initQino({ contentFolder: "content", mediaFolder: "public" });
const schema = z.object({ author: z.string(), tags: z.array(z.string()) });
const authors = qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
});

describe("getRelationTargets", () => {
  test("resolves direct and lazy targets", () => {
    expect(
      getRelationTargets({ author: authors, "tags[*]": () => authors }),
    ).toEqual([
      { path: "author", target: authors, resolveDepth: 1 },
      { path: "tags[*]", target: authors, resolveDepth: 1 },
    ]);
  });

  test("unwraps { target } declarations with their resolveDepth", () => {
    expect(
      getRelationTargets({
        author: { target: authors, resolveDepth: 3 },
        "tags[*]": { target: () => authors },
      }),
    ).toEqual([
      { path: "author", target: authors, resolveDepth: 3 },
      { path: "tags[*]", target: authors, resolveDepth: 1 },
    ]);
  });

  test("skips empty declarations", () => {
    expect(getRelationTargets({ author: undefined })).toEqual([]);
  });
});
