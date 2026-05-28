import type { Simplify } from "type-fest";

import type { QinoMeta } from "../data";
import type { CollectionEntryMeta } from "./entry";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type {
  GenericPath,
  GetterOptions,
  SupportedFileExtension,
} from "./utils";

export type Collection<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  readonly [QinoMeta]: CollectionMeta<Schema, Ext, Rels>;
  getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedCollectionView<Schema, Ext, Rels, R>>>;
  getOne<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedCollectionView<Schema, Ext, Rels, R>>;
};

export type ResolvedCollectionView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
> = Simplify<
  { _meta: CollectionEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  >
>;

export type CollectionMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: "collection";
  readonly schema: Schema;
  readonly directory: GenericPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnyCollection = {
  readonly [QinoMeta]: CollectionMeta<ObjectSchema>;
  getAll(options?: GetterOptions): Promise<
    Array<
      Record<string, unknown> & {
        _meta: CollectionEntryMeta<SupportedFileExtension>;
      }
    >
  >;
  getOne(
    slug: string,
    options?: GetterOptions,
  ): Promise<
    Record<string, unknown> & {
      _meta: CollectionEntryMeta<SupportedFileExtension>;
    }
  >;
};

export type AnyCollectionMeta = AnyCollection[typeof QinoMeta];
