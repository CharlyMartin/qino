import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
  MARKDOWN_FIELD_NAME,
  META_FIELD_NAME,
  RAW_FIELD_NAME,
} from "../data/globals";
import type { MarkdownExtension } from "./generated-fields";
import type { ObjectSchema } from "./schema";
import type { SupportedFileExtension } from "./utils";

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

// Markdown entries also reserve the body and source Qino adds after validation.
type ReservedKeys<Ext extends SupportedFileExtension> =
  | typeof META_FIELD_NAME
  | (Ext extends MarkdownExtension
      ? typeof MARKDOWN_FIELD_NAME | typeof RAW_FIELD_NAME
      : never);

type ConflictingKeys<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = Extract<
  | DeclaredKeys<StandardSchemaV1.InferInput<S>>
  | DeclaredKeys<StandardSchemaV1.InferOutput<S>>,
  ReservedKeys<Ext>
>;

export type NoReservedSchemaFields<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = [ConflictingKeys<S, Ext>] extends [never]
  ? unknown
  : {
      readonly "Qino schema contains reserved fields": ConflictingKeys<S, Ext>;
    };
