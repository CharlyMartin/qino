import type { ObjectSchema } from "../../types/schema";
import type { ValidateParams, validate } from "../validate/validate";
import { parseJsonFile } from "./parse-json-file";
import { parseMarkdownFile } from "./parse-markdown-file";

type ParseFileParams<S extends ObjectSchema> = ValidateParams<S> & {
  data: string;
  validatorFn: typeof validate;
};

export function parseFile<S extends ObjectSchema>({
  filePath,
  ...rest
}: ParseFileParams<S>) {
  return filePath.endsWith(".json")
    ? parseJsonFile({ filePath, ...rest })
    : parseMarkdownFile({ filePath, ...rest });
}
