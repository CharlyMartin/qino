import type { Simplify } from "type-fest";

import type { MetaFieldName } from "./entry";
import type { ObjectSchema, ValidatedOutput } from "./schema";

export type TransformOutput = Record<string, unknown>;

export type Awaitable<Value> = Value | Promise<Value>;

export type TransformEntry<Schema extends ObjectSchema, Meta> = Simplify<
  { [Key in MetaFieldName]: Meta } & ValidatedOutput<Schema>
>;

type NoConflictingKeys<Entry, Output extends TransformOutput> = Output &
  Record<Extract<keyof Entry, keyof Output>, never>;

export type EntryTransform<
  Schema extends ObjectSchema,
  Meta,
  Output extends TransformOutput,
> = (
  entry: Readonly<TransformEntry<Schema, Meta>>,
) => Awaitable<NoConflictingKeys<TransformEntry<Schema, Meta>, Output>>;
