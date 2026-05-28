import type { StandardSchemaV1 } from "@standard-schema/spec";

export type ObjectSchema = StandardSchemaV1<unknown, Record<string, unknown>>;

export type ValidatedOutput<Schema extends ObjectSchema> =
  StandardSchemaV1.InferOutput<Schema>;
