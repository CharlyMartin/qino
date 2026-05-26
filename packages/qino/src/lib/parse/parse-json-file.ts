import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ValidateParams, validate } from "../validate/validate";

type ParseJsonFileParams<S extends StandardSchemaV1> = ValidateParams<S> & {
  data: string;
  validatorFn: typeof validate;
};

export function parseJsonFile<S extends StandardSchemaV1>({
  schema,
  data,
  filePath,
  validatorFn,
}: ParseJsonFileParams<S>) {
  const parsed = JSON.parse(data);

  return validatorFn({ schema, data: parsed, filePath });
}
