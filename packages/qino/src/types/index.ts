import type { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";
import { ExtensionSchema } from "../lib/lock-file";
import { QinoMeta } from "../runtime/symbols";

export type SupportedFileExtension = z.infer<typeof ExtensionSchema>;

export type ObjectSchema = StandardSchemaV1<unknown, Record<string, unknown>>;

export type Out<S extends ObjectSchema> = StandardSchemaV1.InferOutput<S>;

export type RelationFieldKey<S extends ObjectSchema> = {
  [K in keyof Out<S>]-?: NonNullable<Out<S>[K]> extends string
    ? K
    : NonNullable<Out<S>[K]> extends Array<string>
      ? K
      : never;
}[keyof Out<S>];

export type RelationTarget = AnyCollection | (() => AnyCollection);

export type Relations<S extends ObjectSchema> = {
  [K in RelationFieldKey<S>]?: RelationTarget;
};

export type CollectionMeta<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
> = {
  readonly schema: S;
  readonly path: string;
  readonly extension: Ext;
  readonly relations: Relations<S>;
};

export type AnyCollection = {
  readonly [QinoMeta]: CollectionMeta<ObjectSchema>;
};

export type EntryMeta<Ext extends SupportedFileExtension> = {
  slug: string;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type Collection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = {
  readonly [QinoMeta]: CollectionMeta<S, Ext>;
  getAll(): Promise<Array<{ _meta: EntryMeta<Ext> } & Out<S>>>;
  getOne(slug: string): Promise<{ _meta: EntryMeta<Ext> } & Out<S>>;
};

export type CreateCollectionParams<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = {
  relativePath: `/${string}`;
  schema: S;
  extension: Ext;
  relations?: Relations<S>;
};
