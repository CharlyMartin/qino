import type {
  JSON_PATH_ARRAY,
  META_FIELD_NAME,
  SUPPORTED_CONTENT_EXTENSIONS,
} from "../data/globals";
import type {
  AnyCollection,
  AnyCollectionMeta,
  CollectionEntryMeta,
} from "./collection";
import type { AnyItem, AnyItemMeta, ItemEntryMeta } from "./item";
import type { AnyTree, AnyTreeMeta, TreeEntryMeta } from "./tree";

export type SupportedFileExtension =
  (typeof SUPPORTED_CONTENT_EXTENSIONS)[number];

export type JsonPathArray = typeof JSON_PATH_ARRAY;

export type GenericPath = `/${string}`;

export type EmptyObject = Record<never, never>;

export type GetterOptions<View extends string | undefined = string> = {
  view?: View;
  resolveRelations?: never;
  filter?: never;
  sort?: never;
};

export type Slug<S extends string = string> = S;

export type AnyPrimitive = AnyCollection | AnyItem | AnyTree;
export type AnyPrimitiveMeta = AnyCollectionMeta | AnyItemMeta | AnyTreeMeta;

export type AnyEntry = Record<string, unknown> & {
  [K in typeof META_FIELD_NAME]:
    | CollectionEntryMeta
    | ItemEntryMeta
    | TreeEntryMeta;
};
