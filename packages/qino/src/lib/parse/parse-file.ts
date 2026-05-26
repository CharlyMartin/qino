import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ValidateParams, validate } from "../validate";
import { parseJsonFile } from "./parse-json-file";
import { parseMarkdownFile } from "./parse-markdown-file";

type ParseFileParams<S extends StandardSchemaV1> = ValidateParams<S> & {
  data: string;
  validatorFn: typeof validate;
};

export function parseFile<S extends StandardSchemaV1>({
  filePath,
  ...rest
}: ParseFileParams<S>) {
  if (filePath.endsWith(".json")) {
    return parseJsonFile({ filePath, ...rest });
  }

  return parseMarkdownFile({ filePath, ...rest });
}
