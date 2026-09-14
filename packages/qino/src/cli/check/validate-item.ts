import { QinoPrimitiveMarker } from "../../data";
import type { AnyItem } from "../../types";

export async function validateItem(item: AnyItem) {
  const { file } = item[QinoPrimitiveMarker];

  try {
    await item[QinoPrimitiveMarker].readData();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Item "${file}" failed validation: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
