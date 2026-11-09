import type { ResolveDepths } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { EmptyObject } from "./utils";
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
  R extends ResolveDepths = EmptyObject,
> = (
  entry: Readonly<ViewEntry<Schema, Meta, Rels, R>>,
) => Awaitable<NoConflictingKeys<ViewEntry<Schema, Meta, Rels, R>, Output>>;
