import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type { AnyPrimitive, Slug } from "../../types/utils";
import type { RelationErrorContext } from "./create-relation-resolver";
import { readTargetEntry } from "./read-target-entry";

/**
 * Waits for a relation target's entry, read here unless a shared read is
 * passed in. A failure names this reference's source file and relation, so
 * entries that share one read each report their own.
 */
export async function fetchTargetEntry(
  target: AnyPrimitive,
  slug: Slug,
  ctx: RelationErrorContext,
  entry = readTargetEntry(target, slug),
) {
  const meta = target[QinoPrimitiveMarker];

  try {
    return await entry;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    const errorRef =
      meta.is == QinoPrimitives.item ? meta.file : `${meta.directory}/${slug}`;

    throw new Error(
      `Failed to resolve relation "${ctx.relationKey}" → ${errorRef} (from ${ctx.sourceFilePath}): ${message}`,
      { cause: cause instanceof Error ? cause : undefined },
    );
  }
}
