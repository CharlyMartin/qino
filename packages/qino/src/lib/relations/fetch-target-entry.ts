import { QinoMeta } from "../../data";
import type { AnyCollection, AnySingleton } from "../../types";
import { isSingleton } from "../../utils/is-singleton";
import type { RelationErrorContext } from "./create-relation-resolver";

export async function fetchTargetEntry(
  target: AnyCollection | AnySingleton,
  slug: string,
  ctx: RelationErrorContext,
) {
  try {
    return isSingleton(target)
      ? await target.getData({ resolveRelations: false })
      : await target.getOne(slug, { resolveRelations: false });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    const errorRef = isSingleton(target)
      ? target[QinoMeta].file
      : `${target[QinoMeta].directory}/${slug}`;

    throw new Error(
      `Failed to resolve relation "${ctx.relationKey}" → ${errorRef} (from ${ctx.sourceFilePath}): ${message}`,
      { cause: cause instanceof Error ? cause : undefined },
    );
  }
}
