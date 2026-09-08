import type { Simplify } from "type-fest";

import type { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AugmentOutput } from "./augment";
import type { CollectionEntryMeta, MetaFieldName } from "./entry";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { SlugFor } from "./slug-registry";
import type {
  GenericPath,
  GetterOptions,
  Slug,
  SupportedFileExtension,
} from "./utils";

export type Collection<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
> = {
  readonly [QinoPrimitiveMarker]: CollectionMeta<Schema, Ext, Rels>;
  getAll<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<Array<ResolvedCollectionView<Schema, Ext, Rels, R, Derived>>>;
  getOne<R extends ResolveOption = DefaultR>(
    slug: SlugFor<Dir>,
    options?: GetterOptions<R>,
  ): Promise<ResolvedCollectionView<Schema, Ext, Rels, R, Derived>>;
};

export type ResolvedCollectionView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
  Derived extends AugmentOutput = {},
> = Simplify<
  { [K in MetaFieldName]: CollectionEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  > &
    Derived
>;

export type CollectionMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["collection"];
  readonly instanceId: symbol;
  readonly schema: Schema;
  readonly directory: GenericPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnyCollection = {
  readonly [QinoPrimitiveMarker]: CollectionMeta<ObjectSchema>;
  getAll(options?: GetterOptions): Promise<
    Array<
      Record<string, unknown> & {
        [K in MetaFieldName]: CollectionEntryMeta<SupportedFileExtension>;
      }
    >
  >;
  getOne(
    slug: Slug,
    options?: GetterOptions,
  ): Promise<
    Record<string, unknown> & {
      [K in MetaFieldName]: CollectionEntryMeta<SupportedFileExtension>;
    }
  >;
};

export type AnyCollectionMeta = AnyCollection[typeof QinoPrimitiveMarker];
