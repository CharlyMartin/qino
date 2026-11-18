import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";
import type { AnyEntry } from "../../types/utils";
import { createRelationResolver } from "../relations/create-relation-resolver";
import { createResolveCache } from "../relations/create-resolve-cache";
import { applyAugment } from "./apply-augment";
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
      return applyAugment(resolved, view);
    }),
  );
}
