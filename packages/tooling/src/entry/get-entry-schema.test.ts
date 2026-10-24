import { readFileSync } from "node:fs";
import nodePath from "node:path";

import { describe, expect, test } from "vitest";

import { parseConfigFile } from "../config-file/parse-config-file";
import { getEntrySchema } from "./get-entry-schema";

function setup() {
  const path = nodePath.resolve(
    import.meta.dirname,
    "../../../../examples/next-js/qino/_generated/config.json",
  );
  const config = parseConfigFile(JSON.parse(readFileSync(path, "utf8")));
  const posts = config.collections.posts;
  if (!posts) throw new Error("The next-js example has no posts collection.");

  return getEntrySchema(posts);
}

const post = {
  title: "Hello",
  "created-on": "2026-02-28T10:00:00Z",
  "updated-on": "2026-03-01T10:00:00.000Z",
  category: "news",
  image: "/posts/cover.webp",
  author: "jane-doe",
};

describe("getEntrySchema", () => {
  test("accepts a valid entry", () => {
    expect(setup().safeParse(post).success).toBe(true);
  });

  test("rejects invalid fields", () => {
    const schema = setup();

    expect(schema.safeParse({ ...post, title: "" }).success).toBe(false);
    expect(schema.safeParse({ ...post, category: ["news"] }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ ...post, "created-on": "2026-02-30T10:00:00Z" })
        .success,
    ).toBe(false);
  });

  test("rejects missing and unknown fields", () => {
    const { author: _, ...withoutAuthor } = post;
    const schema = setup();

    expect(schema.safeParse(withoutAuthor).success).toBe(false);
    expect(schema.safeParse({ ...post, draft: true }).success).toBe(false);
  });
});
