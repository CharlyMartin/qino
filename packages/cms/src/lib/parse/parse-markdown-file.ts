import matter from "gray-matter";

import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { ObjectSchema } from "../../types/schema";
import { assertNoReservedFrontmatterFields } from "../validate/assert-no-reserved-frontmatter-fields";
import type { ValidateParams, validate } from "../validate/validate";
import { parseYaml } from "./parse-yaml";

type ParseMarkdownFileParams<S extends ObjectSchema> = ValidateParams<S> & {
  data: string;
  validatorFn: typeof validate;
};

export function parseMarkdownFile<S extends ObjectSchema>({
  schema,
  data,
  filePath,
  validatorFn,
}: ParseMarkdownFileParams<S>) {
  const parsed = matter(data, { engines: { yaml: parseYaml } });
  assertNoReservedFrontmatterFields(parsed.data, filePath);

  return validatorFn({
    schema,
    data: { ...parsed.data, [MARKDOWN_FIELD_NAME]: parsed.content },
    filePath,
  });
}
