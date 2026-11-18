import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type { AnyPrimitive, Slug } from "../../types/utils";

/** Reads a relation target's entry: an item's only entry, or one by slug. */
export async function readTargetEntry(target: AnyPrimitive, slug: Slug) {
  const meta = target[QinoPrimitiveMarker];

  switch (meta.is) {
    case QinoPrimitives.item:
      return meta.readEntry();
    case QinoPrimitives.tree:
    case QinoPrimitives.collection:
      return meta.readEntry(slug);
  }
}
