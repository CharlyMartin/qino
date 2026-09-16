import type { MARKDOWN_FIELD_NAME } from "../data/globals";
import type { MarkdownExtension } from "./generated-fields";
import type { ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { ViewEntry } from "./views";

export type AugmentOutput = Record<string, unknown>;

export type Awaitable<Value> = Value | Promise<Value>;

type ReservedMarkdownKey<Meta> = Meta extends {
  filePath: infer File extends string;
}
  ? Extract<File, `${string}${MarkdownExtension}`> extends never
    ? never
    : typeof MARKDOWN_FIELD_NAME
  : never;

type NoConflictingKeys<Entry, Meta, Output extends AugmentOutput> = Output &
  Record<Extract<keyof Entry | ReservedMarkdownKey<Meta>, keyof Output>, never>;

export type EntryAugment<
  Schema extends ObjectSchema,
  Meta,
  Output extends AugmentOutput,
  Rels = object,
  R extends ResolveOption = false,
> = (
  entry: Readonly<ViewEntry<Schema, Meta, Rels, R>>,
) => Awaitable<
  NoConflictingKeys<ViewEntry<Schema, Meta, Rels, R>, Meta, Output>
>;
