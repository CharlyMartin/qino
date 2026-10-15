import { z } from "zod";

import { bodySchema } from "./body";
import { relationSchema } from "./relation";

/**
 * Fields shared by collections, items, and trees. `schema` is the JSON Schema
 * of the entries' fields, kept opaque: see `getEntrySchema` to validate them.
 */
export const primitiveBaseSchema = z.object({
  extension: z.enum([".md", ".mdx", ".markdown", ".json"]),
  body: bodySchema,
  schema: z.record(z.string(), z.unknown()),
  relations: z.array(relationSchema),
});
