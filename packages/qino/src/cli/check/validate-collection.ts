import { consola } from "consola";

import { QinoPrimitiveMarker } from "../../data";
import type { AnyCollection } from "../../types";

export async function validateCollection(collection: AnyCollection) {
  const { directory } = collection[QinoPrimitiveMarker];

  try {
    const entries = await collection[QinoPrimitiveMarker].readAll();

    if (entries.length == 0) {
      consola.warn(`Collection "${directory}" is empty.`);
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Collection "${directory}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
