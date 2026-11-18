import type { Simplify } from "type-fest";

import type {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../data/globals";
import type { PrimitiveCloudConfig } from "./cloud";
import type { GeneratedFields } from "./generated-fields";
import type { PrimitiveInference } from "./infer";
import type { ResolvedMarkdownConfig } from "./markdown-config";
import type { AnyMediaConfig } from "./media";
import type { Relations } from "./relations";
import type { ResolveDepths, ResolveEntry, UnresolvedMode } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { SlugFor } from "./slug-registry";
import type {
  ContentPath,
  EmptyObject,
  GetterOptions,
  PageOptions,
  Slug,
  SupportedFileExtension,
} from "./utils";
import type {
  SelectedView,
  ViewArguments,
  ViewNames,
  ViewSelection,
} from "./views";

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
  Dir extends ContentPath = ContentPath,
  Views extends object = object,
> = PrimitiveInference<Schema, CollectionEntryMeta<Ext>, Rels, Views> & {
  readonly [QinoPrimitiveMarker]: CollectionMeta<Schema, Ext, Rels>;
  getAllSlugs(): Promise<Array<SlugFor<Dir>>>;
  getEntries<Args extends ViewArguments<Views> = []>(
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
  getPaginatedEntries<
    Options extends PageOptions<ViewNames<Views> | undefined>,
  >(
    page: number,
    options: Options,
  ): Promise<
    PaginatedEntries<
      SelectedView<
        Schema,
        CollectionEntryMeta<Ext>,
        Rels,
        Views,
        ViewSelection<Options>
      >
    >
  >;
  getEntry<Args extends ViewArguments<Views> = []>(
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

/** One page of `getPaginatedEntries`, 1-indexed. */
export type PaginatedEntries<Entry> = {
  entries: Array<Entry>;
  page: number;
  perPage: number;
  /** At least 1, so an empty collection still has a first page. */
  pageCount: number;
  /** Entries across every page, after the view's `filter`. */
  total: number;
};

// An entry as read, before a view resolves its relations.
export type ResolvedCollectionView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
> = Simplify<
  GeneratedFields<CollectionEntryMeta<Ext>> &
    ResolveEntry<Schema, Rels, EmptyObject, UnresolvedMode>
>;

export type CollectionMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["collection"];
  readonly instanceId: symbol;
  readonly contentFolder: string;
  readonly schema: Schema;
  readonly directory: ContentPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveDepth: ResolveDepths;
  readonly media: AnyMediaConfig;
  readonly markdown: ResolvedMarkdownConfig;
  readonly cloud?: PrimitiveCloudConfig;
  readonly readEntries: () => Promise<
    Array<ResolvedCollectionView<Schema, Ext, Rels>>
  >;
  readonly readEntry: (
    slug: Slug,
  ) => Promise<ResolvedCollectionView<Schema, Ext, Rels>>;
};

type AnyCollectionEntry = Record<string, unknown> & {
  [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
};

// Erased entries, so typed collections compare structurally, not by variance.
export type AnyCollection = {
  readonly [QinoPrimitiveMarker]: Omit<
    CollectionMeta<ObjectSchema>,
    "readEntries" | "readEntry"
  > & {
    readonly readEntries: () => Promise<Array<AnyCollectionEntry>>;
    readonly readEntry: (slug: Slug) => Promise<AnyCollectionEntry>;
  };
  getAllSlugs(): Promise<Array<Slug>>;
  getEntries(options?: GetterOptions<undefined>): Promise<
    Array<
      Record<string, unknown> & {
        [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
      }
    >
  >;
  getPaginatedEntries(
    page: number,
    options: PageOptions<undefined>,
  ): Promise<
    PaginatedEntries<
      Record<string, unknown> & {
        [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
      }
    >
  >;
  getEntry(
    slug: Slug,
    options?: GetterOptions<undefined>,
  ): Promise<
    Record<string, unknown> & {
      [K in typeof META_FIELD_NAME]: CollectionEntryMeta;
    }
  >;
};

export type AnyCollectionMeta = AnyCollection[typeof QinoPrimitiveMarker];
