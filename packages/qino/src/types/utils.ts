import type { JSON_PATH_ARRAY, SUPPORTED_CONTENT_EXTENSIONS } from "../data";
import type { AnyCollection, AnyCollectionMeta } from "./collection";
import type { AnySingleton, AnySingletonMeta } from "./singleton";
import type { AnyTree, AnyTreeMeta } from "./tree";

export type SupportedFileExtension =
  (typeof SUPPORTED_CONTENT_EXTENSIONS)[number];

export type JsonPathArray = typeof JSON_PATH_ARRAY;

export type GenericPath = `/${string}`;

export type GetterOptions<View extends string | undefined = string> = {
  view?: View;
  resolveRelations?: never;
};

export type Slug = string;

export type AnyPrimitive = AnyCollection | AnySingleton | AnyTree;
export type AnyPrimitiveMeta =
  | AnyCollectionMeta
  | AnySingletonMeta
  | AnyTreeMeta;
