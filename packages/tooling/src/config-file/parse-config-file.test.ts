import { describe, expect, test } from "vitest";
import { ZodError } from "zod";

import { parseConfigFile } from "./parse-config-file";

const media = { saveAs: "{id}/{name}-{hash}", fields: [] };
const base = { body: null, schema: { type: "object" }, relations: [] };

function setup() {
  return {
    version: 1,
    config: { contentFolder: "src/content", mediaFolder: "public" },
    cloud: {
      publish: {
        mode: "commit_to_default_branch",
        reviewBeforePublish: { bypassIfAdmin: false },
      },
    },
    collections: {
      posts: {
        ...base,
        directory: "posts",
        displayAs: "Blog posts",
        displayEntryAs: "{title}",
        extension: ".md",
        body: { format: "markdown" },
        relations: [
          {
            path: "author",
            target: { kind: "collection", id: "authors" },
            cardinality: "one",
          },
        ],
        cloud: {
          searchableBy: ["title"],
          sortableBy: [],
          hiddenFields: ["notes"],
          saveAs: "{title}",
          media: { ...media, fields: ["image"] },
        },
      },
    },
    items: {
      "pages/home.json": {
        ...base,
        file: "pages/home.json",
        displayAs: "Home page",
        extension: ".json",
        cloud: { hiddenFields: [], media: { ...media, accepted: [] } },
      },
    },
    trees: {
      docs: {
        ...base,
        directory: "docs",
        displayAs: "docs",
        displayEntryAs: "{title}",
        extension: ".mdx",
        titleField: "title",
        orderFileName: "_order.json",
        cloud: { searchableBy: [], hiddenFields: [], media },
      },
    },
  };
}

describe("parseConfigFile", () => {
  test("parses a version 1 config file", () => {
    const json = setup();
    expect(parseConfigFile(json)).toEqual(json);
  });

  test("parses config files without displayAs or displayEntryAs", () => {
    const json = setup();
    const {
      displayAs: _,
      displayEntryAs: __,
      ...posts
    } = json.collections.posts;
    const parsed = parseConfigFile({ ...json, collections: { posts } });
    expect(parsed.collections.posts).not.toHaveProperty("displayAs");
    expect(parsed.collections.posts).not.toHaveProperty("displayEntryAs");
  });

  test("parses review turned off", () => {
    const json = setup();
    json.cloud.publish.reviewBeforePublish = false as never;
    expect(parseConfigFile(json).cloud?.publish.reviewBeforePublish).toBe(
      false,
    );
  });

  test("rejects review turned on without its settings", () => {
    const json = setup();
    json.cloud.publish.reviewBeforePublish = true as never;
    expect(() => parseConfigFile(json)).toThrow(ZodError);
  });

  test("strips unknown keys, so added optional fields don't fail", () => {
    const json = { ...setup(), ui: { theme: "dark" } };
    expect(parseConfigFile(json)).not.toHaveProperty("ui");
  });

  test("fails on an unsupported version", () => {
    expect(() => parseConfigFile({ ...setup(), version: 2 })).toThrow(
      "Unsupported config.json version",
    );
  });

  test("fails on a missing or invalid field", () => {
    const { trees: _, ...withoutTrees } = setup();
    expect(() => parseConfigFile(withoutTrees)).toThrow(ZodError);

    const json = setup();
    json.cloud.publish.mode = "push";
    expect(() => parseConfigFile(json)).toThrow(ZodError);
  });
});
