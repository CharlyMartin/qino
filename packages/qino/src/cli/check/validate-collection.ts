import { QinoPrimitiveMarker } from "../../data";
import type { AnyCollection } from "../../types";

export async function validateCollection(collection: AnyCollection) {
  const { directory } = collection[QinoPrimitiveMarker];

  try {
    const entries = await collection.getAll({ resolveRelations: false });

    if (entries.length == 0) {
      console.warn(`⚠️  Collection "${directory}" is empty.`);
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Collection "${directory}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
