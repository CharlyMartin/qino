import { QinoConfigMarker, QinoPrimitives } from "../../data";
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
import { createPathRegistry } from "./create-path-registry";

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

  const registry = createPathRegistry();

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
      const collection = createCollection(ctx, params);
      registry.register({
        kind: QinoPrimitives.collection,
        path: params.directory,
      });
      return collection;
    },
    createSingleton<
      S extends ObjectSchema,
      F extends SingletonFile,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
    >(
      params: CreateSingletonParams<S, F, Rels, DefaultR>,
    ): Singleton<S, ExtractSingletonExtension<F>, Rels, DefaultR> {
      const singleton = createSingleton(ctx, params);
      registry.register({
        kind: QinoPrimitives.singleton,
        path: params.file,
      });
      return singleton;
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
      const tree = createTree(ctx, params);
      registry.register({ kind: QinoPrimitives.tree, path: params.directory });
      return tree;
    },
  };
}
