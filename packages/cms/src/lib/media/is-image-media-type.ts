import { IMAGE_MEDIA_TYPES } from "../../data/globals";
import type { ImageMediaType } from "../../types/media";

export function isImageMediaType(type: unknown): type is ImageMediaType {
  return IMAGE_MEDIA_TYPES.includes(type as never);
}
