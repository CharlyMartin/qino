import type { SupportedFileExtension } from "./utils";

export type CollectionEntryMeta<Ext extends SupportedFileExtension> = {
  slug: string;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type SingletonEntryMeta<Ext extends SupportedFileExtension> = {
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type AnyEntry = Record<string, unknown> & {
  _meta:
    | CollectionEntryMeta<SupportedFileExtension>
    | SingletonEntryMeta<SupportedFileExtension>;
};
