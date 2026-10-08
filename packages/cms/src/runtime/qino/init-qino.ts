import { QinoConfigMarker } from "../../data/globals";
import type { Collection } from "../../types/collection";
import type { ExtractItemExtension, Item, ItemFile } from "../../types/item";
import type { Relations } from "../../types/relations";
import type { ObjectSchema } from "../../types/schema";
import type { StringKeys, Tree } from "../../types/tree";
import type { ContentPath, SupportedFileExtension } from "../../types/utils";
import type { ConfiguredViews } from "../../types/views";
import {
  type DefineCollectionParams,
  defineCollection,
} from "../collections/define-collection";
import { type DefineItemParams, defineItem } from "../items/define-item";
import { type DefineTreeParams, defineTree } from "../trees/define-tree";

export type QinoMediaConfig = {
  /** Folder serving media at the site root, e.g. `"public"`. */
  readonly folder: string;
  /** Extensions checked by `qino check`. Omit to skip the media check. */
  readonly extensions?: ReadonlyArray<string>;
  /** Globs matched against URL paths to skip, e.g. `"/api/**"`. */
  readonly ignore?: ReadonlyArray<string>;
};

export type QinoConfig = {
  readonly contentFolder: string;
  readonly media: QinoMediaConfig;
};

export type QinoContext = {
  readonly instanceId: symbol;
} & QinoConfig;

export function initQino(config: QinoConfig) {
  const ctx: QinoContext = {
    instanceId: Symbol("qino.instance"),
    ...config,
  };

  return {
    [QinoConfigMarker]: ctx,
    defineCollection<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Rels extends Relations<S> = object,
      Dir extends ContentPath = ContentPath,
      const Views extends object = object,
    >(
      params: DefineCollectionParams<S, Ext, Rels, Dir, Views>,
    ): Collection<S, Ext, Rels, Dir, ConfiguredViews<Views>> {
      return defineCollection(ctx, params);
    },
    defineItem<
      S extends ObjectSchema,
      F extends ItemFile,
      Rels extends Relations<S> = object,
      const Views extends object = object,
    >(
      params: DefineItemParams<S, F, Rels, Views>,
    ): Item<S, ExtractItemExtension<F>, Rels, ConfiguredViews<Views>> {
      return defineItem(ctx, params);
    },
    defineTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      Rels extends Relations<S> = object,
      Dir extends ContentPath = ContentPath,
      const Views extends object = object,
    >(
      params: DefineTreeParams<S, Ext, Title, Rels, Dir, Views>,
    ): Tree<S, Ext, Title, Rels, Dir, ConfiguredViews<Views>> {
      return defineTree(ctx, params);
    },
  };
}
