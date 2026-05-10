import type { StandardSchemaV1 } from "@standard-schema/spec";

export function validate<S extends StandardSchemaV1>(
  schema: S,
  data: unknown,
  filePath: string,
) {
  const result = schema["~standard"].validate(data);

  if (result instanceof Promise) {
    throw new Error(
      `Schema for ${filePath} returned a Promise. Qino requires synchronous Standard Schema validators.`,
    );
  }

  if (result.issues) {
    const lines = result.issues.map((issue) => {
      const segments = issue.path?.map((segment) => {
        if (typeof segment == "object" && segment != null) {
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

  return result.value as StandardSchemaV1.InferOutput<S>;
}
