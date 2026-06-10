import type { JSON_PATH_ARRAY, SUPPORTED_CONTENT_EXTENSIONS } from "../data";
import type { AnyCollection } from "./collection";
import type { ResolveOption } from "./resolve";
import type { AnySingleton } from "./singleton";
import type { AnyTree } from "./tree";

export type SupportedFileExtension =
  (typeof SUPPORTED_CONTENT_EXTENSIONS)[number];

export type JsonPathArray = typeof JSON_PATH_ARRAY;

export type GenericPath = `/${string}`;

export type GetterOptions<R extends ResolveOption = ResolveOption> = {
  resolveRelations?: R;
};

export type Slug = string;

export type AnyPrimitive = AnyCollection | AnySingleton | AnyTree;
