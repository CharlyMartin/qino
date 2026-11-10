import { QinoConfigMarker } from "../../data/globals";
import type { CliConfig } from "../../types/cli";
import type { CloudConfig } from "../../types/cloud";
import type { Collection } from "../../types/collection";
import type { ExtractItemExtension, Item, ItemFile } from "../../types/item";
import type { MarkdownTocFlag } from "../../types/markdown-toc";
import type { MediaConfig, TaggedRelations } from "../../types/media";
import type { Relations } from "../../types/relations";
import type { ObjectSchema } from "../../types/schema";
import type { StringKeys, Tree } from "../../types/tree";
import type {
  ContentPath,
  EmptyObject,
  SupportedFileExtension,
} from "../../types/utils";
import type { ConfiguredViews } from "../../types/views";
import {
  type DefineCollectionParams,
  defineCollection,
} from "../collections/define-collection";
import { type DefineItemParams, defineItem } from "../items/define-item";
import { type DefineTreeParams, defineTree } from "../trees/define-tree";

export type QinoConfig = {
  readonly contentFolder: string;
  /** Folder serving media at the site root, e.g. `"public"`. */
  readonly mediaFolder: string;
  /** Configures the CLI commands, keyed by command. */
  readonly cli?: CliConfig;
  /**
   * Configures the Qino cloud UI. When set, `qino build` writes
   * `qino/_generated/config.json`, describing the config, primitives, schemas
   * (as JSON Schema), and relations. Meant to be committed and read by the
   * cloud UI; `qino check` fails when it's stale.
   */
  readonly cloud?: CloudConfig;
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
      const Rels extends Relations<S> = object,
      Dir extends ContentPath = ContentPath,
      const Views extends object = object,
      const SaveEntryAs extends string = never,
      const DisplayEntryAs extends string = never,
      const Media extends MediaConfig<S, Ext> = EmptyObject,
      const Stats extends boolean = false,
      Toc extends MarkdownTocFlag = false,
    >(
      params: DefineCollectionParams<
        S,
        Ext,
        Rels,
        Dir,
        Views,
        SaveEntryAs,
        DisplayEntryAs,
        Media,
        Stats,
        Toc
      >,
    ): Collection<
      S,
      Ext,
      TaggedRelations<Rels, Media, Stats, Toc>,
      Dir,
      ConfiguredViews<Views>
    > {
      return defineCollection(ctx, params);
    },
    defineItem<
      S extends ObjectSchema,
      F extends ItemFile,
      const Rels extends Relations<S> = object,
      const Views extends object = object,
      const Media extends MediaConfig<S, ExtractItemExtension<F>> = EmptyObject,
      const Stats extends boolean = false,
      Toc extends MarkdownTocFlag = false,
    >(
      params: DefineItemParams<S, F, Rels, Views, Media, Stats, Toc>,
    ): Item<
      S,
      ExtractItemExtension<F>,
      TaggedRelations<Rels, Media, Stats, Toc>,
      ConfiguredViews<Views>
    > {
      return defineItem(ctx, params);
    },
    defineTree<
      S extends ObjectSchema,
      Ext extends SupportedFileExtension,
      Title extends StringKeys<S>,
      const Rels extends Relations<S> = object,
      Dir extends ContentPath = ContentPath,
      const Views extends object = object,
      const SaveEntryAs extends string = never,
      const DisplayEntryAs extends string = never,
      const Media extends MediaConfig<S, Ext> = EmptyObject,
      const Stats extends boolean = false,
      Toc extends MarkdownTocFlag = false,
    >(
      params: DefineTreeParams<
        S,
        Ext,
        Title,
        Rels,
        Dir,
        Views,
        SaveEntryAs,
        DisplayEntryAs,
        Media,
        Stats,
        Toc
      >,
    ): Tree<
      S,
      Ext,
      Title,
      TaggedRelations<Rels, Media, Stats, Toc>,
      Dir,
      ConfiguredViews<Views>
    > {
      return defineTree(ctx, params);
    },
  };
}
