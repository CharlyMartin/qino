import type { Simplify } from "type-fest";

import type { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { MetaFieldName, SingletonEntryMeta } from "./entry";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { TransformOutput } from "./transform";
import type {
  GenericPath,
  GetterOptions,
  SupportedFileExtension,
} from "./utils";

export type SingletonMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["singleton"];
  readonly instanceId: symbol;
  readonly schema: Schema;
  readonly file: GenericPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnySingleton = {
  readonly [QinoPrimitiveMarker]: SingletonMeta<ObjectSchema>;
  getData(options?: GetterOptions): Promise<
    Record<string, unknown> & {
      [K in MetaFieldName]: SingletonEntryMeta<SupportedFileExtension>;
    }
  >;
};

export type AnySingletonMeta = AnySingleton[typeof QinoPrimitiveMarker];

export type Singleton<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
  Derived extends TransformOutput = {},
> = {
  readonly [QinoPrimitiveMarker]: SingletonMeta<Schema, Ext, Rels>;
  getData<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<ResolvedSingletonView<Schema, Ext, Rels, R, Derived>>;
};

export type SingletonFile = {
  [Ext in SupportedFileExtension]: `${GenericPath}${Ext}`;
}[SupportedFileExtension];

export type ExtractSingletonExtension<F extends string> =
  F extends `${string}.json`
    ? ".json"
    : F extends `${string}.mdx`
      ? ".mdx"
      : F extends `${string}.markdown`
        ? ".markdown"
        : F extends `${string}.md`
          ? ".md"
          : never;

export type ResolvedSingletonView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
  Derived extends TransformOutput = {},
> = Simplify<
  { [K in MetaFieldName]: SingletonEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  > &
    Derived
>;
