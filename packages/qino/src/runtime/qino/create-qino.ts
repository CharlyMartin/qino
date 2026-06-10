import { QinoConfigMarker } from "../../data";
import type {
  Collection,
  ExtractSingletonExtension,
  ObjectSchema,
  Relations,
  ResolveOption,
  Singleton,
  SingletonFile,
  StringKeys,
  SupportedFileExtension,
  Tree,
} from "../../types";
import {
  type CreateCollectionParams,
  createCollection,
} from "../collections/create-collection";
import {
  type CreateSingletonParams,
  createSingleton,
} from "../singletons/create-singleton";
import { type CreateTreeParams, createTree } from "../trees/create-tree";

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
    createCollection<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
    >(
      params: CreateCollectionParams<S, Ext, Rels, DefaultR>,
    ): Collection<S, Ext, Rels, DefaultR> {
      return createCollection(ctx, params);
    },
    createSingleton<
      S extends ObjectSchema,
      F extends SingletonFile,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
    >(
      params: CreateSingletonParams<S, F, Rels, DefaultR>,
    ): Singleton<S, ExtractSingletonExtension<F>, Rels, DefaultR> {
      return createSingleton(ctx, params);
    },
    createTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
    >(
      params: CreateTreeParams<S, Ext, Title, Rels, DefaultR>,
    ): Tree<S, Ext, Title, Rels, DefaultR> {
      return createTree(ctx, params);
    },
  };
}
