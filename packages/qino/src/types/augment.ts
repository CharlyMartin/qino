import type { Simplify } from "type-fest";

import type { MetaFieldName } from "./entry";
import type { ObjectSchema, ValidatedOutput } from "./schema";

export type AugmentOutput = Record<string, unknown>;

export type Awaitable<Value> = Value | Promise<Value>;

export type AugmentEntry<Schema extends ObjectSchema, Meta> = Simplify<
  { [Key in MetaFieldName]: Meta } & ValidatedOutput<Schema>
>;

type NoConflictingKeys<Entry, Output extends AugmentOutput> = Output &
  Record<Extract<keyof Entry, keyof Output>, never>;

export type EntryAugment<
  Schema extends ObjectSchema,
  Meta,
  Output extends AugmentOutput,
> = (
  entry: Readonly<AugmentEntry<Schema, Meta>>,
) => Awaitable<NoConflictingKeys<AugmentEntry<Schema, Meta>, Output>>;
