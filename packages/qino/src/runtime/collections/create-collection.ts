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
import { assertNoRootViewSettings } from "../../lib/views/assert-no-root-view-settings";
import type {
  Collection,
  GenericPath,
  ObjectSchema,
  Relations,
  SlugFor,
  SupportedFileExtension,
} from "../../types";
import type { CollectionEntryMeta } from "../../types/collection";
import type {
  CollectionViewDefinition,
  CollectionViewFactory,
} from "../../types/collection-views";
import type { Slug } from "../../types/utils";
import type {
  ConfiguredViews,
  RootViewSettings,
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
  Dir extends GenericPath = GenericPath,
  Views extends object = object,
> = {
  directory: Dir;
  schema: Schema;
  extension: Ext;
  relations?: Rels;
  views?: ViewsConfig<
    Views,
    CollectionViewFactory<Schema, CollectionEntryMeta<Ext>, Rels>,
    CollectionViewDefinition
  >;
} & RootViewSettings;

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<S> = object,
  Dir extends GenericPath = GenericPath,
  const Views extends object = object,
>(ctx: QinoContext, params: CreateCollectionParams<S, Ext, Rels, Dir, Views>) {
  const { directory, schema, extension, relations } = params;
  const collectionRelations = (relations ?? {}) as Rels;
  assertNoRootViewSettings(params);
  const views = buildViews(params.views, "collection");
  const defaultResolve = views?.default.resolveRelations ?? false;
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
    getMany,
    getAllSlugs,
    getOne,
  } as const satisfies Collection<S, Ext, Rels, Dir, ConfiguredViews<Views>>;

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

  async function getMany<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(...[options]: Args) {
    const view = selectView(views, options) as CollectionViewDefinition;
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
        ConfiguredViews<Views>,
        ViewSelection<Args[0]>
      >
    >;
  }

  async function getOne<
    Args extends ViewArguments<ConfiguredViews<Views>> = [],
  >(slug: Slug, ...[options]: Args) {
    const view = selectView(views, options) as CollectionViewDefinition;
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
      ConfiguredViews<Views>,
      ViewSelection<Args[0]>
    >;
  }
}
