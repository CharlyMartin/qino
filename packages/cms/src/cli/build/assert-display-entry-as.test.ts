import { describe, expect, test } from "vitest";
import { z } from "zod";

import { assertDisplayEntryAs } from "./assert-display-entry-as";
import { serializeJsonSchema } from "./serialize-json-schema";

const jsonSchema = serializeJsonSchema(
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    company: z.string().optional(),
    tags: z.array(z.string()),
  }),
  "authors",
);

function assert(displayEntryAs: string) {
  assertDisplayEntryAs(displayEntryAs, jsonSchema, "authors");
}

describe("assertDisplayEntryAs", () => {
  test.each([
    "{firstName} {lastName}",
    "{lastName}, {firstName} ({age})",
    "Dr. {lastName}",
    "{firstName}/{lastName}",
  ])("accepts %s", (displayEntryAs) => {
    expect(() => assert(displayEntryAs)).not.toThrow();
  });

  test("needs a token", () => {
    expect(() => assert("Author")).toThrow(
      'displayEntryAs "Author" of "authors" needs at least one {field}.',
    );
  });

  test("rejects an unknown field", () => {
    expect(() => assert("{nope}")).toThrow(
      'displayEntryAs "{nope}" of "authors" has an unknown field "{nope}". Use a top-level field of its schema input.',
    );
  });

  test("rejects a non-scalar field", () => {
    expect(() => assert("{tags}")).toThrow(
      'displayEntryAs "{tags}" of "authors" uses "{tags}", which isn\'t a string, number, or boolean on disk.',
    );
  });

  test("rejects an optional field", () => {
    expect(() => assert("{firstName} at {company}")).toThrow(
      'displayEntryAs "{firstName} at {company}" of "authors" uses "{company}", which is optional, so entries could get an empty label. Use a required field.',
    );
  });
});
