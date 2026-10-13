import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { assertRelationTargetsDiscovered } from "./assert-relation-targets-discovered";

const qino = initQino({ contentFolder: "content", mediaFolder: "public" });
const schema = z.object({ title: z.string(), author: z.string() });

const authors = qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
});
const posts = qino.defineCollection({
  directory: "posts",
  schema,
  extension: ".md",
  relations: { author: () => authors },
});

describe("assertRelationTargetsDiscovered", () => {
  test("passes when every target was discovered", () => {
    expect(() =>
      assertRelationTargetsDiscovered([posts, authors]),
    ).not.toThrow();
  });

  test("throws when a target wasn't discovered", () => {
    expect(() => assertRelationTargetsDiscovered([posts])).toThrow(
      'Relation "author" of "posts" targets collection "authors", which isn\'t exported from a file under "qino/". Export it so it can be described in config.json.',
    );
  });
});
