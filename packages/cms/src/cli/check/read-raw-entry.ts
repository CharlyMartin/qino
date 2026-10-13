import fs from "node:fs/promises";

import { parseFile } from "../../lib/parse/parse-file";
import type { validate } from "../../lib/validate/validate";
import type { ObjectSchema } from "../../types/schema";

// Skips validation: returns the parsed frontmatter or JSON as it is on disk.
const passThrough = (({ data }) => data) as typeof validate;

/**
 * Reads an entry file without validating it, so it can be compared with the
 * schema's output.
 */
export async function readRawEntry(schema: ObjectSchema, filePath: string) {
  const data = await fs.readFile(filePath, "utf-8");

  return parseFile({ schema, data, filePath, validatorFn: passThrough });
}
