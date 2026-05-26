import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Simplify } from "type-fest";
import type { z } from "zod";

import { type JSON_PATH_ARRAY, QinoMeta } from "../lib";
import type { ExtensionSchema } from "../schemas/lock-file";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";

export type SupportedFileExtension = z.infer<typeof ExtensionSchema>;

export type JsonPathArray = typeof JSON_PATH_ARRAY;

export type ObjectSchema = StandardSchemaV1<unknown, Record<string, unknown>>;

export type ValidatedOutput<Schema extends ObjectSchema> =
  StandardSchemaV1.InferOutput<Schema>;

type RelationPath<T, Prefix extends string = ""> =
  NonNullable<T> extends string
    ? Prefix
    : NonNullable<T> extends Array<infer U>
      ? RelationPath<U, `${Prefix}${JsonPathArray}`>
      : NonNullable<T> extends Record<string, unknown>
        ? {
            [K in keyof NonNullable<T> & string]: RelationPath<
              NonNullable<T>[K],
              Prefix extends "" ? K : `${Prefix}.${K}`
            >;
          }[keyof NonNullable<T> & string]
        : never;

export type RelationTarget =
  | AnyCollection
  | AnySingleton
  | (() => AnyCollection | AnySingleton);

export type Relations<Schema extends ObjectSchema> = {
  [P in RelationPath<ValidatedOutput<Schema>>]?: RelationTarget;
};

export type CollectionMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: "collection";
  readonly schema: Schema;
  readonly directory: `/${string}`;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnyCollection = {
  readonly [QinoMeta]: CollectionMeta<ObjectSchema>;
  getAll(
    options?: GetterOptions,
  ): Promise<
    Array<
      Record<string, unknown> & { _meta: EntryMeta<SupportedFileExtension> }
    >
  >;
  getOne(
    slug: string,
    options?: GetterOptions,
  ): Promise<
    Record<string, unknown> & { _meta: EntryMeta<SupportedFileExtension> }
  >;
};

export type EntryMeta<Ext extends SupportedFileExtension> = {
  slug: string;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type SingletonEntryMeta<Ext extends SupportedFileExtension> = {
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type SingletonMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: "singleton";
  readonly schema: Schema;
  readonly file: `/${string}`;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnySingleton = {
  readonly [QinoMeta]: SingletonMeta<ObjectSchema>;
  getData(options?: GetterOptions): Promise<
    Record<string, unknown> & {
      _meta: SingletonEntryMeta<SupportedFileExtension>;
    }
  >;
};

export type GetterOptions<R extends ResolveOption = ResolveOption> = {
  resolveRelations?: R;
};

export type ResolvedView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
> = Simplify<
  { _meta: EntryMeta<Ext> } & ResolveEntry<Schema, Rels, NormalizeDepth<R>>
>;

export type ResolvedSingletonView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
> = Simplify<
  { _meta: SingletonEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  >
>;

export type Collection<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  readonly [QinoMeta]: CollectionMeta<Schema, Ext, Rels>;
  getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedView<Schema, Ext, Rels, R>>>;
  getOne<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedView<Schema, Ext, Rels, R>>;
};

export type Singleton<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  readonly [QinoMeta]: SingletonMeta<Schema, Ext, Rels>;
  getData<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<ResolvedSingletonView<Schema, Ext, Rels, R>>;
};

export type CreateCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  directory: `/${string}`;
  schema: Schema;
  extension: Ext;
  relations?: Rels;
  resolveRelations?: DefaultR;
};

export type SingletonFile = {
  [Ext in SupportedFileExtension]: `/${string}${Ext}`;
}[SupportedFileExtension];

export type ExtractSingletonExtension<F extends string> =
  F extends `${string}.json`
    ? ".json"
    : F extends `${string}.mdx`
      ? ".mdx"
      : F extends `${string}.md`
        ? ".md"
        : never;

export type CreateSingletonParams<
  Schema extends ObjectSchema,
  F extends SingletonFile,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  file: F;
  schema: Schema;
  relations?: Rels;
  resolveRelations?: DefaultR;
};
