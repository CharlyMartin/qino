import { QinoPrimitiveMarker, QinoPrimitives } from "../../data";
import type { AnyPrimitive } from "../../types";
import type { Slug } from "../../types/utils";
import type { RelationErrorContext } from "./create-relation-resolver";

export async function fetchTargetEntry(
  target: AnyPrimitive,
  slug: Slug,
  ctx: RelationErrorContext,
) {
  const meta = target[QinoPrimitiveMarker];

  try {
    switch (meta.is) {
      case QinoPrimitives.item:
        return await meta.readData();
      case QinoPrimitives.tree:
        return await meta.readEntry(slug);
      case QinoPrimitives.collection:
        return await meta.readOne(slug);
    }
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
