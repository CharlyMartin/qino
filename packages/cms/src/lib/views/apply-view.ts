import type { RelationTarget } from "../../types/relations";
import type { AnyEntry } from "../../types/utils";
import { augmentEntry } from "../augment/augment-entry";
import { createRelationResolver } from "../relations/create-relation-resolver";
import { createResolveCache } from "../relations/create-resolve-cache";
import { normalizeDepth } from "../relations/normalize-depth";
import type { RuntimeView } from "./select-view";

export async function applyView(
  entries: Array<AnyEntry>,
  view: RuntimeView,
  relations: Record<string, RelationTarget | undefined>,
  instanceId: symbol,
) {
  const resolver = createRelationResolver(createResolveCache());
  const depth = normalizeDepth(view.resolveRelations ?? false);
  return Promise.all(
    entries.map(async (entry) => {
      const resolved = (await resolver.resolveEntry(entry, {
        relations,
        depth,
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
