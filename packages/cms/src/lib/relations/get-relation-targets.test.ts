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
      { path: "author", target: authors },
      { path: "tags[*]", target: authors },
    ]);
  });

  test("skips empty declarations", () => {
    expect(getRelationTargets({ author: undefined })).toEqual([]);
  });
});
