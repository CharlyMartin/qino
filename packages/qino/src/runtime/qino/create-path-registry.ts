import { describePathConflict, type PrimitivePath } from "../../lib";

// Per-instance registry that fails fast when a newly created primitive owns a
// path conflicting with one already registered. Conflict is symmetric, so
// checking new-vs-existing incrementally is equivalent to the lint's all-pairs
// pass — it just happens organically at definition time.
export function createPathRegistry() {
  const entries: Array<PrimitivePath> = [];

  return {
    register(entry: PrimitivePath) {
      for (const existing of entries) {
        const message = describePathConflict(entry, existing);
        if (message) throw new Error(message);
      }
      entries.push(entry);
    },
  };
}
