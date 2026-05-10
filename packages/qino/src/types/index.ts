import type { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";
import { ExtensionSchema } from "../lib/lock-file";
import { QinoMeta } from "../runtime/symbols";

export type SupportedFileExtension = z.infer<typeof ExtensionSchema>;

export type ObjectSchema = StandardSchemaV1<unknown, Record<string, unknown>>;

export type Out<Schema extends ObjectSchema> =
  StandardSchemaV1.InferOutput<Schema>;

export type RelationFieldKey<Schema extends ObjectSchema> = {
  [K in keyof Out<Schema>]-?: NonNullable<Out<Schema>[K]> extends string
    ? K
    : NonNullable<Out<Schema>[K]> extends Array<string>
      ? K
      : never;
}[keyof Out<Schema>];

export type RelationTarget = AnyCollection | (() => AnyCollection);

export type Relations<Schema extends ObjectSchema> = {
  [K in RelationFieldKey<Schema>]?: RelationTarget;
};

export type CollectionMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
> = {
  readonly schema: Schema;
  readonly path: string;
  readonly extension: Ext;
  readonly relations: Relations<Schema>;
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
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = {
  readonly [QinoMeta]: CollectionMeta<Schema, Ext>;
  getAll(): Promise<Array<{ _meta: EntryMeta<Ext> } & Out<Schema>>>;
  getOne(slug: string): Promise<{ _meta: EntryMeta<Ext> } & Out<Schema>>;
};

export type CreateCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
> = {
  relativePath: `/${string}`;
  schema: Schema;
  extension: Ext;
  relations?: Relations<Schema>;
};
