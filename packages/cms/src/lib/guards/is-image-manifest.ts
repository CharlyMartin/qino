import { isPlainObject } from "es-toolkit";

import type { ImageManifest } from "../../types/media";

const REQUIRED_NUMBERS = ["size", "width", "height"] as const;
const OPTIONAL_NUMBERS = ["blurWidth", "blurHeight"] as const;

/** Whether every record holds what a `QinoImage` and the rule checks need. */
export function isImageManifest(value: unknown): value is ImageManifest {
  return (
    isPlainObject(value) &&
    Object.values(value).every(
      (image) =>
        isPlainObject(image) &&
        REQUIRED_NUMBERS.every((key) => typeof image[key] == "number") &&
        OPTIONAL_NUMBERS.every(
          (key) => image[key] == undefined || typeof image[key] == "number",
        ) &&
        (image.blurDataURL == undefined ||
          typeof image.blurDataURL == "string"),
    )
  );
}
