import { z } from "zod";

import type { ConfigFile } from "../schema/config-file";

type Primitive =
  | ConfigFile["collections"][string]
  | ConfigFile["items"][string]
  | ConfigFile["trees"][string];

/**
 * Builds a zod schema validating a primitive's entry fields (frontmatter, or
 * the whole JSON file), from the JSON Schema in `config.json`.
 */
export function getEntrySchema(primitive: Primitive) {
  return z.fromJSONSchema(primitive.schema as z.core.JSONSchema.JSONSchema);
}
