import { QinoPrimitiveMarker } from "../../data";
import type { AnySingleton } from "../../types";

export async function validateSingleton(singleton: AnySingleton) {
  const { file } = singleton[QinoPrimitiveMarker];

  try {
    await singleton.getData({ resolveRelations: false });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Singleton "${file}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
