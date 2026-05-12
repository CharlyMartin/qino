import type { StandardSchemaV1 } from "@standard-schema/spec";

export type ValidateFileParams<S extends StandardSchemaV1> = {
  schema: S;
  raw: string;
  filePath: string;
};
