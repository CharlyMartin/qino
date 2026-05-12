import { validate } from ".";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ValidateFileParams } from "./types";

export function validateJsonFile<S extends StandardSchemaV1>({
  schema,
  raw,
  filePath,
}: ValidateFileParams<S>) {
  const parsed = JSON.parse(raw);

  return validate(schema, parsed, filePath);
}
