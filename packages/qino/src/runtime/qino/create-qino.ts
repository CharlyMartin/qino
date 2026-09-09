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
      DefaultR extends ResolveOption = false,
      Dir extends GenericPath = GenericPath,
      Derived extends AugmentOutput = {},
      const Views extends object = object,
    >(
      params: CreateCollectionParams<
        S,
        Ext,
        Rels,
        DefaultR,
        Dir,
        Derived,
        Views
      >,
    ): Collection<S, Ext, Rels, DefaultR, Dir, Derived, Views> {
      return createCollection(ctx, params);
    },
    createSingleton<
      S extends ObjectSchema,
      F extends SingletonFile,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = false,
      Derived extends AugmentOutput = {},
      const Views extends object = object,
    >(
      params: CreateSingletonParams<S, F, Rels, DefaultR, Derived, Views>,
    ): Singleton<
      S,
      ExtractSingletonExtension<F>,
      Rels,
      DefaultR,
      Derived,
      Views
    > {
      return createSingleton(ctx, params);
    },
    createTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      Rels extends Relations<S> = object,
      DefaultR extends ResolveOption = false,
      Dir extends GenericPath = GenericPath,
      Derived extends AugmentOutput = {},
      const Views extends object = object,
    >(
      params: CreateTreeParams<
        S,
        Ext,
        Title,
        Rels,
        DefaultR,
        Dir,
        Derived,
        Views
      >,
    ): Tree<S, Ext, Title, Rels, DefaultR, Dir, Derived, Views> {
      return createTree(ctx, params);
    },
  };
}
