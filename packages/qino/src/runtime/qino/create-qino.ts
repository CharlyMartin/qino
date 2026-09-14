import { QinoConfigMarker } from "../../data";
import type {
  Collection,
  ExtractItemExtension,
  GenericPath,
  Item,
  ItemFile,
  ObjectSchema,
  Relations,
  StringKeys,
  SupportedFileExtension,
  Tree,
} from "../../types";
import type { ConfiguredViews } from "../../types/views";
import {
  type DefineCollectionParams,
  defineCollection,
} from "../collections/define-collection";
import { type DefineItemParams, defineItem } from "../items/define-item";
import { type DefineTreeParams, defineTree } from "../trees/define-tree";

export type QinoConfig = {
  readonly contentFolder: string;
  readonly mediaFolder: string;
};

export type QinoContext = {
  readonly instanceId: symbol;
} & QinoConfig;

export function createQino(config: QinoConfig) {
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
      Dir extends GenericPath = GenericPath,
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
      Dir extends GenericPath = GenericPath,
      const Views extends object = object,
    >(
      params: DefineTreeParams<S, Ext, Title, Rels, Dir, Views>,
    ): Tree<S, Ext, Title, Rels, Dir, ConfiguredViews<Views>> {
      return defineTree(ctx, params);
    },
  };
}
