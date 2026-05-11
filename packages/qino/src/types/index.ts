import type { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";
import { ExtensionSchema } from "../lib/lock-file";
import { QinoMeta } from "../runtime/symbols";

export type SupportedFileExtension = z.infer<typeof ExtensionSchema>;

export type ObjectSchema = StandardSchemaV1<unknown, Record<string, unknown>>;

export type ValidatedOutput<Schema extends ObjectSchema> =
  StandardSchemaV1.InferOutput<Schema>;

type RelationPath<T, Prefix extends string = ""> =
  NonNullable<T> extends string
    ? Prefix
    : NonNullable<T> extends Array<infer U>
      ? RelationPath<U, `${Prefix}[*]`>
      : NonNullable<T> extends Record<string, unknown>
        ? {
            [K in keyof NonNullable<T> & string]: RelationPath<
              NonNullable<T>[K],
              Prefix extends "" ? K : `${Prefix}.${K}`
            >;
          }[keyof NonNullable<T> & string]
        : never;

export type RelationTarget = AnyCollection | (() => AnyCollection);

export type Relations<Schema extends ObjectSchema> = {
  [P in RelationPath<ValidatedOutput<Schema>>]?: RelationTarget;
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
  getAll(): Promise<Array<{ _meta: EntryMeta<Ext> } & ValidatedOutput<Schema>>>;
  getOne(
    slug: string,
  ): Promise<{ _meta: EntryMeta<Ext> } & ValidatedOutput<Schema>>;
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
