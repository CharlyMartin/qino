import type { StandardSchemaV1 } from "@standard-schema/spec";

import { assertNoReservedSchemaFields } from "./assert-no-reserved-schema-fields";

export type ValidateParams<S extends StandardSchemaV1> = {
  schema: S;
  data: unknown;
  filePath: string;
};

export function validate<S extends StandardSchemaV1>({
  schema,
  data,
  filePath,
}: ValidateParams<S>) {
  assertNoReservedSchemaFields(data, filePath);
  const result = schema["~standard"].validate(data);

  if (result instanceof Promise) {
    throw new Error(
      `Schema for ${filePath} returned a Promise. Qino requires synchronous Standard Schema validators.`,
    );
  }

  if (result.issues) {
    const lines = result.issues.map((issue) => {
      const segments = issue.path?.map((segment) => {
        if (typeof segment == "object" && segment !== null) {
          return String(segment.key);
        }
        return String(segment);
      });
      const path =
        segments && segments.length > 0 ? segments.join(".") : "(root)";
      return `  ${path}: ${issue.message}`;
    });
    throw new Error(`Validation failed for ${filePath}:\n${lines.join("\n")}`);
  }

  assertNoReservedSchemaFields(result.value, filePath);
  return result.value as StandardSchemaV1.InferOutput<S>;
}
