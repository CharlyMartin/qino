import { QinoConfigMarker } from "../../data";
import type {
  Collection,
  ExtractSingletonExtension,
  GenericPath,
  ObjectSchema,
  Relations,
  Singleton,
  SingletonFile,
  StringKeys,
  SupportedFileExtension,
  Tree,
} from "../../types";
import type { ConfiguredViews } from "../../types/views";
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
      Dir extends GenericPath = GenericPath,
      const Views extends object = object,
    >(
      params: CreateCollectionParams<S, Ext, Rels, Dir, Views>,
    ): Collection<S, Ext, Rels, Dir, ConfiguredViews<Views>> {
      return createCollection(ctx, params);
    },
    createSingleton<
      S extends ObjectSchema,
      F extends SingletonFile,
      Rels extends Relations<S> = object,
      const Views extends object = object,
    >(
      params: CreateSingletonParams<S, F, Rels, Views>,
    ): Singleton<
      S,
      ExtractSingletonExtension<F>,
      Rels,
      ConfiguredViews<Views>
    > {
      return createSingleton(ctx, params);
    },
    createTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      Rels extends Relations<S> = object,
      Dir extends GenericPath = GenericPath,
      const Views extends object = object,
    >(
      params: CreateTreeParams<S, Ext, Title, Rels, Dir, Views>,
    ): Tree<S, Ext, Title, Rels, Dir, ConfiguredViews<Views>> {
      return createTree(ctx, params);
    },
  };
}
