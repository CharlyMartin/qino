import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { META_FIELD_NAME } from "../data/globals";
import type { ObjectSchema } from "./schema";

// Distribute over unions and keep declared keys even on catchall schemas.
// Erased types and index signatures rely on the runtime property checks.
type DeclaredKeys<Value> = Value extends unknown
  ? keyof {
      [K in keyof Value as string extends K
        ? never
        : number extends K
          ? never
          : symbol extends K
            ? never
            : K]: unknown;
    }
  : never;

type ConflictingKeys<S extends ObjectSchema> = Extract<
  | DeclaredKeys<StandardSchemaV1.InferInput<S>>
  | DeclaredKeys<StandardSchemaV1.InferOutput<S>>,
  typeof META_FIELD_NAME
>;

export type NoReservedSchemaFields<S extends ObjectSchema> = [
  ConflictingKeys<S>,
] extends [never]
  ? unknown
  : {
      readonly "Qino schema contains reserved fields": ConflictingKeys<S>;
    };
