import type { StandardSchemaV1 } from "@standard-schema/spec";
import matter from "gray-matter";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import type { ValidateParams, validate } from "../validate";

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
    [MARKDOWN_BODY_FIELD_NAME]: parsed.content,
  };

  return validatorFn({ schema, data: augmentedData, filePath });
}
