import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { CollectionViewDefinition } from "../../types/collection-views";
import type { AnyRelations } from "../../types/relations";
import type { AnyEntry, Slug } from "../../types/utils";
import { settleInOrder } from "../async/settle-in-order";
import { unwrapSettled } from "../async/unwrap-settled";
import { getEntrySlug } from "../meta/get-entry-slug";
import { createRelationResolver } from "../relations/create-relation-resolver";
import { createResolveCache } from "../relations/create-resolve-cache";
import { applyAugment } from "../views/apply-augment";
import { shapeListing } from "../views/shape-listing";
import {
  createDependencyCollector,
  type DependencyCollector,
} from "./create-dependency-collector";
import { hasUnchangedFiles } from "./has-unchanged-files";
import type { FileObservation } from "./observe-file";

type ListingSource = {
  getAllSlugs: () => Promise<Array<Slug>>;
  readEntry: (
    slug: Slug,
    dependencies?: DependencyCollector,
  ) => Promise<AnyEntry>;
  relations: AnyRelations;
  instanceId: symbol;
  /** Keeps entries between calls, reused while their files are unchanged. */
  incremental: boolean;
};

type ListingSlot = {
  /** After images and relations, before `augment`. */
  entry: AnyEntry;
  dependencies: Map<string, FileObservation>;
};

type ListingState = {
  slots: Map<Slug, ListingSlot>;
  /** The last listing's order, which the next sort starts from. */
  order: Array<Slug>;
};

type BuildContext = {
  view: CollectionViewDefinition;
  state: ListingState;
  resolver: ReturnType<typeof createRelationResolver>;
};

type StaleRead = {
  entry: AnyEntry;
  dependencies?: DependencyCollector;
};

/**
 * Lists a collection's entries for a view: reads them, resolves their images
 * and relations, runs `augment`, then `filter` in slug order and `sort`, with
 * ties in slug order. A failure throws the first error in slug order, and a
 * read error wins over a relation or `augment` one.
 *
 * With `incremental`, each view keeps its entries, before `augment`, with
 * every file they were built from. A call reuses an entry while a sync stat
 * finds each of those files unchanged, and builds the others again. `augment`,
 * `filter`, and `sort` still run on every call.
 */
export function createListingCache(source: ListingSource) {
  const states = new Map<string, ListingState>();

  return { list };

  async function list(viewName: string, view: CollectionViewDefinition) {
    const slugs = await source.getAllSlugs();
    const state = getState(viewName, slugs);
    const stale = slugs.filter((slug) => !state.slots.has(slug));

    // Every read settles before any relation resolves, as when not incremental.
    const reads = unwrapSettled(
      await Promise.allSettled(stale.map((slug) => readStale(slug))),
    );
    const readsBySlug = new Map(
      stale.map((slug, index) => [slug, reads[index] as StaleRead]),
    );

    const build: BuildContext = {
      view,
      state,
      resolver: createRelationResolver(createResolveCache()),
    };
    const entries = await settleInOrder(
      slugs.map((slug) => {
        const read = readsBySlug.get(slug);
        if (read) {
          return resolveStale(slug, read, build).then((entry) =>
            applyAugment(entry, view),
          );
        }
        // A sync augment adds no promise, so reused entries stay cheap.
        try {
          return applyAugment(
            (state.slots.get(slug) as ListingSlot).entry,
            view,
          );
        } catch (cause) {
          return Promise.reject(cause);
        }
      }),
    );

    const listed = shapeListing({
      entries,
      view,
      slugs,
      lastOrder: state.order,
    });
    // Only a reused, sorted listing starts its next sort from this order.
    if (source.incremental && view.sort) state.order = listed.map(getEntrySlug);
    return listed;
  }

  // Drops the entries whose files changed, so the call builds them again.
  function getState(viewName: string, slugs: Array<Slug>) {
    if (!source.incremental)
      return { slots: new Map(), order: [] } as ListingState;

    let state = states.get(viewName);
    if (!state) {
      state = { slots: new Map(), order: [] };
      states.set(viewName, state);
    }

    const listed = new Set(slugs);
    // One stat per file per call: posts that share an author stat it once.
    const versions = new Map<string, string | undefined>();
    for (const [slug, slot] of state.slots) {
      if (
        !listed.has(slug) ||
        !hasUnchangedFiles(slot.dependencies, versions)
      ) {
        state.slots.delete(slug);
      }
    }
    return state;
  }

  async function readStale(slug: Slug) {
    const dependencies = source.incremental
      ? createDependencyCollector()
      : undefined;
    const entry = await source.readEntry(slug, dependencies);
    return { entry, dependencies } satisfies StaleRead;
  }

  async function resolveStale(
    slug: Slug,
    { entry, dependencies }: StaleRead,
    { view, state, resolver }: BuildContext,
  ) {
    const resolved = (await resolver.resolveEntry(entry, {
      relations: source.relations,
      depth: MAX_RESOLVE_DEPTH,
      override: false,
      viewDepths: view.resolveDepth,
      sourceInstanceId: source.instanceId,
      dependencies,
    })) as AnyEntry;
    // Kept even if its augment then fails: it's still valid input.
    if (dependencies?.isReusable()) {
      state.slots.set(slug, {
        entry: resolved,
        dependencies: dependencies.observations,
      });
    }
    return resolved;
  }
}
