import fs from "node:fs/promises";

import { parseFile } from "../lib/parse/parse-file";
import { validate } from "../lib/validate/validate";
import type { ObjectSchema } from "../types/schema";

/** An uncached `ReadParsedFile` for tree walks under test. */
export function makeReadParsed(schema: ObjectSchema) {
  return async (filePath: string) =>
    parseFile({
      schema,
      data: await fs.readFile(filePath, "utf-8"),
      filePath,
      validatorFn: validate,
    }) as Record<string, unknown>;
}
