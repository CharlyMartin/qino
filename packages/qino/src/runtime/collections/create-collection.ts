import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../../data";
import {
  applyView,
  buildEntryMeta,
  buildViews,
  parseFile,
  selectView,
  validate,
} from "../../lib";
import type {
  AugmentOutput,
  Collection,
  GenericPath,
  ObjectSchema,
  Relations,
  ResolveOption,
  SlugFor,
  SupportedFileExtension,
} from "../../types";
import type { EntryAugment } from "../../types/augment";
import type {
  CollectionDefaultCallbacks,
  CollectionViewDefinition,
  CollectionViewFactory,
} from "../../types/collection-views";
import type { CollectionEntryMeta } from "../../types/entry";
import type { Slug } from "../../types/utils";
import type {
  ConfiguredViews,
  SelectedView,
  ViewArguments,
  ViewSelection,
  ViewsConfig,
} from "../../types/views";
import { removeExtension } from "../../utils/remove-extension";
import type { QinoContext } from "../qino/create-qino";
import { globCollectionPaths } from "./glob-collection-paths";

export type CreateCollectionParams<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = false,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
  Views extends object = object,
> = {
  directory: Dir;
  schema: Schema;
  extension: Ext;
  relations?: Rels;
  resolveRelations?: DefaultR;
  augment?: EntryAugment<
    Schema,
    CollectionEntryMeta<Ext>,
    Derived,
    Rels,
    DefaultR
  >;
  views?: ViewsConfig<
    Views,
    CollectionViewFactory<Schema, CollectionEntryMeta<Ext>, Rels>,
    CollectionViewDefinition
  >;
} & CollectionDefaultCallbacks<
  Schema,
  CollectionEntryMeta<Ext>,
  Rels,
  DefaultR,
  Derived
>;

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  DefaultR extends ResolveOption = false,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
  const Views extends object = object,
>(
  ctx: QinoContext,
  params: CreateCollectionParams<S, Ext, Rels, DefaultR, Dir, Derived, Views>,
) {
  const { directory, schema, extension, relations, resolveRelations, augment } =
    params;
  const collectionRelations = (relations ?? {}) as Rels;
  const defaultResolve = resolveRelations ?? false;
  const views = buildViews(params.views, "collection");
  const defaults = {
    resolveRelations: defaultResolve,
    augment,
    filter: params.filter,
    sort: params.sort,
  };
  const collectionDirectory = nodePath.join(ctx.contentFolder, directory);

  const collection = {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.collection,
      instanceId: ctx.instanceId,
      schema,
      directory,
      extension,
      relations: collectionRelations,
      resolveRelations: defaultResolve,
      readAll,
      readOne,
    },
    getAll,
    getAllSlugs,
    getOne,
  } as const satisfies Collection<
    S,
    Ext,
    Rels,
    DefaultR,
    Dir,
    Derived,
    ConfiguredViews<Views>
  >;

  return collection;

  async function getAllSlugs() {
    const paths = await globCollectionPaths({
      absoluteDirPath: collectionDirectory,
      extension,
    });

    return paths.map((path) => removeExtension(path) as SlugFor<Dir>).sort();
  }

  async function readOne(slug: Slug) {
    const meta = buildEntryMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });
    const data = await fs.readFile(meta.filePath, "utf-8");
    return {
      ...parseFile({
        schema,
        data,
        filePath: meta.filePath,
        validatorFn: validate,
      }),
      [META_FIELD_NAME]: meta,
    };
  }

  async function readAll() {
    const paths = await globCollectionPaths({
      absoluteDirPath: collectionDirectory,
      extension,
    });
    return Promise.all(
      paths.map((path) => readOne(path.slice(0, -extension.length))),
    );
  }

  async function getAll<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(
      defaults,
      views,
      options,
    ) as CollectionViewDefinition;
    const entries = await readAll();
    const augmented = await applyView(
      entries,
      view,
      collectionRelations,
      ctx.instanceId,
    );
    const { filter, sort } = view;
    const filtered = filter
      ? augmented.filter((entry) => filter(entry as never))
      : augmented;
    return (
      sort
        ? filtered.toSorted((a, b) => sort(a as never, b as never))
        : filtered
    ) as Array<
      SelectedView<
        S,
        CollectionEntryMeta<Ext>,
        Rels,
        DefaultR,
        Derived,
        ConfiguredViews<Views>,
        ViewSelection<Args[0]>
      >
    >;
  }

  async function getOne<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(slug: Slug, ...[options]: Args) {
    const view = selectView(
      defaults,
      views,
      options,
    ) as CollectionViewDefinition;
    const entry = await readOne(slug);
    const [result] = await applyView(
      [entry],
      view,
      collectionRelations,
      ctx.instanceId,
    );
    if (view.filter && !view.filter(result as never)) {
      throw new Error(
        `Entry "${slug}" in collection "${directory}" is excluded by view "${options?.view ?? "default"}".`,
      );
    }
    return result as SelectedView<
      S,
      CollectionEntryMeta<Ext>,
      Rels,
      DefaultR,
      Derived,
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
