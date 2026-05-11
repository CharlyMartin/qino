import { validate } from "../../lib";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type ValidateJsonFileParams<S extends StandardSchemaV1> = {
  schema: S;
  raw: string;
  filePath: string;
};

export function validateJsonFile<S extends StandardSchemaV1>({
  schema,
  raw,
  filePath,
}: ValidateJsonFileParams<S>) {
  return validate(schema, JSON.parse(raw), filePath);
}
