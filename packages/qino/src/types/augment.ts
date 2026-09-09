import type { ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { ViewEntry } from "./views";

export type AugmentOutput = Record<string, unknown>;

export type Awaitable<Value> = Value | Promise<Value>;

type NoConflictingKeys<Entry, Output extends AugmentOutput> = Output &
  Record<Extract<keyof Entry, keyof Output>, never>;

export type EntryAugment<
  Schema extends ObjectSchema,
  Meta,
  Output extends AugmentOutput,
  Rels = object,
  R extends ResolveOption = false,
> = (
  entry: Readonly<ViewEntry<Schema, Meta, Rels, R>>,
) => Awaitable<NoConflictingKeys<ViewEntry<Schema, Meta, Rels, R>, Output>>;
