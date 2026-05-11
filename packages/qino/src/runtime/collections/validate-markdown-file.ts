import { validate } from "../../lib";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import matter from "gray-matter";

const CONTENT_FIELD_NAME = "markdown";

type ValidateMarkdownFileParams<S extends StandardSchemaV1> = {
  schema: S;
  raw: string;
  filePath: string;
};

export function validateMarkdownFile<S extends StandardSchemaV1>({
  schema,
  raw,
  filePath,
}: ValidateMarkdownFileParams<S>) {
  const parsed = matter(raw);

  return validate(
    schema,
    { [CONTENT_FIELD_NAME]: parsed.content, ...parsed.data },
    filePath,
  );
}
