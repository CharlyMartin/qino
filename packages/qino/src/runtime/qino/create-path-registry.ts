import { QinoPrimitiveMarker, QinoPrimitives } from "../../data";
import { describePathConflict, type PrimitivePath } from "../../lib";
import type { AnyPrimitive } from "../../types";

// Per-instance registry that fails fast when a newly created primitive owns a
// path conflicting with one already registered. Conflict is symmetric, so
// checking new-vs-existing incrementally is equivalent to the lint's all-pairs
// pass — it just happens organically at definition time.
export function createPathRegistry() {
  const entries: Array<PrimitivePath> = [];

  return {
    register(primitive: AnyPrimitive) {
      const entry = toEntry(primitive);
      for (const existing of entries) {
        const message = describePathConflict(entry, existing);
        if (message) throw new Error(message);
      }
      entries.push(entry);
    },
  };
}

function toEntry(primitive: AnyPrimitive) {
  const meta = primitive[QinoPrimitiveMarker];
  return {
    kind: meta.is,
    path: meta.is == QinoPrimitives.singleton ? meta.file : meta.directory,
  } satisfies PrimitivePath;
}
