import type { META_FIELD_NAME } from "../data";
import type { Slug, SupportedFileExtension } from "./utils";

export type MetaFieldName = typeof META_FIELD_NAME;

export type CollectionEntryMeta<Ext extends SupportedFileExtension> = {
  slug: Slug;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type SingletonEntryMeta<Ext extends SupportedFileExtension> = {
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type TreeEntryMeta<Ext extends SupportedFileExtension> = {
  slug: Slug;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type AnyEntry = Record<string, unknown> & {
  [K in MetaFieldName]:
    | CollectionEntryMeta<SupportedFileExtension>
    | SingletonEntryMeta<SupportedFileExtension>
    | TreeEntryMeta<SupportedFileExtension>;
};
