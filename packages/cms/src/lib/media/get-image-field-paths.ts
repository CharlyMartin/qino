import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyPrimitive } from "../../types/utils";
import { isImageMediaType } from "./is-image-media-type";

/** The `media` paths of a primitive's image fields, as declared. */
export function getImageFieldPaths(primitive: AnyPrimitive) {
  return Object.entries(primitive[QinoPrimitiveMarker].media)
    .filter(([, rule]) => rule && isImageMediaType(rule.accepted))
    .map(([path]) => path);
}
