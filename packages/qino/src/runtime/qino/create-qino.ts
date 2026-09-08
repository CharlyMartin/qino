import { QinoConfigMarker } from "../../data";
import type {
  AugmentOutput,
  Collection,
  ExtractSingletonExtension,
  GenericPath,
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
      Dir extends GenericPath = GenericPath,
      Derived extends AugmentOutput = {},
    >(
      params: CreateCollectionParams<S, Ext, Rels, DefaultR, Dir, Derived>,
    ): Collection<S, Ext, Rels, DefaultR, Dir, Derived> {
      const collection = createCollection(ctx, params);
      registry.register(collection);
      return collection;
    },
    createSingleton<
      S extends ObjectSchema,
      F extends SingletonFile,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
      Derived extends AugmentOutput = {},
    >(
      params: CreateSingletonParams<S, F, Rels, DefaultR, Derived>,
    ): Singleton<S, ExtractSingletonExtension<F>, Rels, DefaultR, Derived> {
      const singleton = createSingleton(ctx, params);
      registry.register(singleton);
      return singleton;
    },
    createTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = true,
      Dir extends GenericPath = GenericPath,
      Derived extends AugmentOutput = {},
    >(
      params: CreateTreeParams<S, Ext, Title, Rels, DefaultR, Dir, Derived>,
    ): Tree<S, Ext, Title, Rels, DefaultR, Dir, Derived> {
      const tree = createTree(ctx, params);
      registry.register(tree);
      return tree;
    },
  };
}
