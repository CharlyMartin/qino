import type { StandardSchemaV1 } from "@standard-schema/spec";
import matter from "gray-matter";

import type { ValidateParams, validate } from "../validate";

const CONTENT_FIELD_NAME = "markdown";

type ParseMarkdownFileParams<S extends StandardSchemaV1> = ValidateParams<S> & {
  data: string;
  validatorFn: typeof validate;
};

export function parseMarkdownFile<S extends StandardSchemaV1>({
  schema,
  data,
  filePath,
  validatorFn,
}: ParseMarkdownFileParams<S>) {
  const parsed = matter(data);
  const augmentedData = {
    ...parsed.data,
    [CONTENT_FIELD_NAME]: parsed.content,
  };

  return validatorFn({ schema, data: augmentedData, filePath });
}
