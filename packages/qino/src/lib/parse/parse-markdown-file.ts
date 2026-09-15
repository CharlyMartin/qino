import type { StandardSchemaV1 } from "@standard-schema/spec";
import matter from "gray-matter";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data/globals";
import type { ValidateParams, validate } from "../validate/validate";
import { parseYaml } from "./parse-yaml";

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
  const parsed = matter(data, { engines: { yaml: parseYaml } });
  const augmentedData = {
    ...parsed.data,
    [MARKDOWN_BODY_FIELD_NAME]: parsed.content,
  };

  return validatorFn({ schema, data: augmentedData, filePath });
}
