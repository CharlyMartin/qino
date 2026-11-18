import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type { AnyPrimitive, Slug } from "../../types/utils";
import type { DependencyCollector } from "../cache/create-dependency-collector";

/**
 * Reads a relation target's entry: an item's only entry, or one by slug.
 * `dependencies` records the files the read used.
 */
export async function readTargetEntry(
  target: AnyPrimitive,
  slug: Slug,
  dependencies?: DependencyCollector,
) {
  const meta = target[QinoPrimitiveMarker];

  switch (meta.is) {
    case QinoPrimitives.item:
      return meta.readEntry(dependencies);
    case QinoPrimitives.tree:
    case QinoPrimitives.collection:
      return meta.readEntry(slug, dependencies);
  }
}
