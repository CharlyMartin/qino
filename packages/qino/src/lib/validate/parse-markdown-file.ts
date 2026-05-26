import type { StandardSchemaV1 } from "@standard-schema/spec";
import matter from "gray-matter";

import type { ValidateFileParams } from "./types";
import { validate } from "./validate";

const CONTENT_FIELD_NAME = "markdown";

export function parseMarkdownFile<S extends StandardSchemaV1>({
  schema,
  raw,
  filePath,
}: ValidateFileParams<S>) {
  const parsed = matter(raw);
  const augmented = { ...parsed.data, [CONTENT_FIELD_NAME]: parsed.content };

  return validate(schema, augmented, filePath);
}
