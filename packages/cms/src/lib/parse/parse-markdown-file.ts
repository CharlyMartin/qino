import { parseFrontmatter } from "@qino/tooling/frontmatter";

import {
  MARKDOWN_FIELD_NAME,
  RAW_FIELD_NAME,
  STATS_FIELD_NAME,
  TOC_FIELD_NAME,
} from "../../data/globals";
import type { ObjectSchema } from "../../types/schema";
import { assertNoReservedMarkdownFields } from "../validate/assert-no-reserved-markdown-fields";
import type { ValidateParams, validate } from "../validate/validate";

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
  const parsed = parseFrontmatter(data);
  assertNoReservedMarkdownFields(parsed.data, filePath);

  const validated = validatorFn({
    schema,
    data: parsed.data,
    filePath,
    generatedFields: [
      MARKDOWN_FIELD_NAME,
      RAW_FIELD_NAME,
      STATS_FIELD_NAME,
      TOC_FIELD_NAME,
    ],
  });
  assertNoReservedMarkdownFields(validated, filePath);

  return {
    ...validated,
    [MARKDOWN_FIELD_NAME]: parsed.body,
    [RAW_FIELD_NAME]: data,
  };
}
