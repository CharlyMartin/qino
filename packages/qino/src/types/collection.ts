import type { Simplify } from "type-fest";

import type {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../data/globals";
import type { AugmentOutput } from "./augment";
import type { PrimitiveInference } from "./infer";
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
import type { SelectedView, ViewArguments, ViewSelection } from "./views";

export type CollectionEntryMeta<
  Ext extends SupportedFileExtension = SupportedFileExtension,
> = {
  slug: Slug;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type Collection<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  Dir extends GenericPath = GenericPath,
  Views extends object = object,
> = PrimitiveInference<Schema, CollectionEntryMeta<Ext>, Rels, Views> & {
  readonly [QinoPrimitiveMarker]: CollectionMeta<Schema, Ext, Rels>;
  getAllSlugs(): Promise<Array<SlugFor<Dir>>>;
  getMany<Args extends ViewArguments<Views> = []>(
    ...args: Args
  ): Promise<
    Array<
      SelectedView<
        Schema,
        CollectionEntryMeta<Ext>,
        Rels,
        Views,
        ViewSelection<Args[0]>
      >
    >
  >;
  getOne<Args extends ViewArguments<Views> = []>(
    slug: SlugFor<Dir>,
    ...args: Args
  ): Promise<
    SelectedView<
      Schema,
      CollectionEntryMeta<Ext>,
      Rels,
      Views,
      ViewSelection<Args[0]>
    >
  >;
};

export type ResolvedCollectionView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
  Derived extends AugmentOutput = {},
> = Simplify<
  { [K in typeof META_FIELD_NAME]: CollectionEntryMeta<Ext> } & ResolveEntry<
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
  readonly readAll: () => Promise<
    Array<ResolvedCollectionView<Schema, Ext, Rels, false>>
  >;
  readonly readOne: (
    slug: Slug,
  ) => Promise<ResolvedCollectionView<Schema, Ext, Rels, false>>;
};

export type AnyCollection = {
  readonly [QinoPrimitiveMarker]: CollectionMeta<ObjectSchema>;
  getAllSlugs(): Promise<Array<Slug>>;
  getMany(options?: GetterOptions<undefined>): Promise<
    Array<
      Record<string, unknown> & {
        [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
      }
    >
  >;
  getOne(
    slug: Slug,
    options?: GetterOptions<undefined>,
  ): Promise<
    Record<string, unknown> & {
      [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
    }
  >;
};

export type AnyCollectionMeta = AnyCollection[typeof QinoPrimitiveMarker];
