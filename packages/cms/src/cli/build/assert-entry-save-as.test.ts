import { describe, expect, test } from "vitest";
import { z } from "zod";

import { assertEntrySaveAs } from "./assert-entry-save-as";
import { serializeJsonSchema } from "./serialize-json-schema";

const jsonSchema = serializeJsonSchema(
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    "created-on": z.string(),
    company: z.string().optional(),
    role: z.string().default("writer"),
    tags: z.array(z.string()),
  }),
  "authors",
);

function assert(saveAs: string, schema = jsonSchema) {
  assertEntrySaveAs(saveAs, schema, "authors");
}

describe("assertEntrySaveAs", () => {
  test.each([
    "{firstName}-{lastName}",
    "author-{lastName}-{age}",
    "{created-on}-{firstName}",
  ])("accepts %s", (saveAs) => {
    expect(() => assert(saveAs)).not.toThrow();
  });

  test("needs a token", () => {
    expect(() => assert("author")).toThrow(
      'saveAs "author" of "authors" needs at least one {field}.',
    );
  });

  test.each(["people/{lastName}", "{lastName}.json", "../{lastName}"])(
    "rejects folders and extensions: %s",
    (saveAs) => {
      expect(() => assert(saveAs)).toThrow(
        `saveAs "${saveAs}" of "authors" can't contain "/" or ".": the cloud UI adds the extension and, in trees, the parent folder.`,
      );
    },
  );

  test("rejects an unknown field", () => {
    expect(() => assert("{nope}")).toThrow(
      'saveAs "{nope}" of "authors" has an unknown field "{nope}". Use a top-level field of its schema input.',
    );
  });

  test("rejects a non-scalar field", () => {
    expect(() => assert("{tags}")).toThrow(
      'saveAs "{tags}" of "authors" uses "{tags}", which isn\'t a string, number, or boolean on disk.',
    );
  });

  test.each(["company", "role"])("rejects optional field %s", (field) => {
    expect(() => assert(`{${field}}`)).toThrow(
      `saveAs "{${field}}" of "authors" uses "{${field}}", which is optional, so entries could get an empty name. Use a required field.`,
    );
  });

  test("needs the field in every union variant", () => {
    const schema = serializeJsonSchema(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("a"), slug: z.string() }),
        z.object({ kind: z.literal("b"), slug: z.string().optional() }),
      ]),
      "posts",
    );

    expect(() => assert("{kind}", schema)).not.toThrow();
    expect(() => assert("{slug}", schema)).toThrow("which is optional");
  });

  test("needs a scalar in every union variant", () => {
    const schema = serializeJsonSchema(
      z.union([
        z.object({ title: z.string() }),
        z.object({ title: z.array(z.string()) }),
      ]),
      "posts",
    );

    expect(() => assert("{title}", schema)).toThrow(
      "which isn't a string, number, or boolean on disk",
    );
  });
});
