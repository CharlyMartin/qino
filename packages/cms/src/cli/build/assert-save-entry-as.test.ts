import { describe, expect, test } from "vitest";
import { z } from "zod";

import { assertSaveEntryAs } from "./assert-save-entry-as";
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

function assert(saveEntryAs: string, schema = jsonSchema) {
  assertSaveEntryAs(saveEntryAs, schema, "authors");
}

describe("assertSaveEntryAs", () => {
  test.each([
    "{firstName}-{lastName}",
    "author-{lastName}-{age}",
    "{created-on}-{firstName}",
  ])("accepts %s", (saveEntryAs) => {
    expect(() => assert(saveEntryAs)).not.toThrow();
  });

  test("needs a token", () => {
    expect(() => assert("author")).toThrow(
      'saveEntryAs "author" of "authors" needs at least one {field}.',
    );
  });

  test.each(["people/{lastName}", "{lastName}.json", "../{lastName}"])(
    "rejects folders and extensions: %s",
    (saveEntryAs) => {
      expect(() => assert(saveEntryAs)).toThrow(
        `saveEntryAs "${saveEntryAs}" of "authors" can't contain "/" or ".": the cloud UI adds the extension and, in trees, the parent folder.`,
      );
    },
  );

  test("rejects an unknown field", () => {
    expect(() => assert("{nope}")).toThrow(
      'saveEntryAs "{nope}" of "authors" has an unknown field "{nope}". Use a top-level field of its schema input.',
    );
  });

  test("rejects a non-scalar field", () => {
    expect(() => assert("{tags}")).toThrow(
      'saveEntryAs "{tags}" of "authors" uses "{tags}", which isn\'t a string, number, or boolean on disk.',
    );
  });

  test.each(["company", "role"])("rejects optional field %s", (field) => {
    expect(() => assert(`{${field}}`)).toThrow(
      `saveEntryAs "{${field}}" of "authors" uses "{${field}}", which is optional, so entries could get an empty name. Use a required field.`,
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

  test("accepts a field an intersection narrows to a scalar", () => {
    const schema = serializeJsonSchema(
      z.object({
        title: z.unknown().and(z.string()),
        slug: z.union([z.string(), z.array(z.string())]).and(z.string()),
      }),
      "posts",
    );

    expect(() => assert("{title}-{slug}", schema)).not.toThrow();
  });
});
