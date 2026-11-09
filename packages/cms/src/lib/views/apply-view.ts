import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";
import type { AnyEntry } from "../../types/utils";
import { augmentEntry } from "../augment/augment-entry";
import { createRelationResolver } from "../relations/create-relation-resolver";
import { createResolveCache } from "../relations/create-resolve-cache";
import type { RuntimeView } from "./select-view";

export async function applyView(
  entries: Array<AnyEntry>,
  view: RuntimeView,
  relations: AnyRelations,
  instanceId: symbol,
) {
  const resolver = createRelationResolver(createResolveCache());
  return Promise.all(
    entries.map(async (entry) => {
      const resolved = (await resolver.resolveEntry(entry, {
        relations,
        depth: MAX_RESOLVE_DEPTH,
        override: false,
        viewDepths: view.resolveDepth,
        sourceInstanceId: instanceId,
      })) as AnyEntry;
      const augment = view.augment;
      return augmentEntry(
        resolved,
        augment ? (value) => augment(value as never) : undefined,
      );
    }),
  );
}
