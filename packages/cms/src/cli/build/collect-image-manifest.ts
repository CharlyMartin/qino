import nodePath from "node:path";

import { normalizeMediaUrl } from "@qino/tooling/media";
import { collectPathValues, parsePath } from "@qino/tooling/relations";

import { QinoPrimitiveMarker } from "../../data/globals";
import { getFileSize } from "../../lib/fs/get-file-size";
import { isImageMediaType } from "../../lib/media/is-image-media-type";
import type { ImageManifest, QinoImage } from "../../types/media";
import type { AnyPrimitive } from "../../types/utils";
import { readValidatedEntries } from "../check/read-validated-entries";
import { compareCodeUnits } from "./compare-code-units";

/**
 * Records each image an image field references, read from the entries
 * `qino check` read: their images are already decoded, so none is decoded
 * again. `undefined` when no primitive has an image field.
 */
export async function collectImageManifest(
  primitives: Array<AnyPrimitive>,
  mediaFolder: string,
) {
  const fields = primitives
    .map((primitive) => ({
      primitive,
      paths: Object.entries(primitive[QinoPrimitiveMarker].media)
        .filter(([, rule]) => rule && isImageMediaType(rule.accepted))
        .map(([path]) => parsePath(path)),
    }))
    .filter(({ paths }) => paths.length);

  if (fields.length == 0) return undefined;

  const images = new Map<string, QinoImage>();
  for (const { primitive, paths } of fields) {
    for (const entry of await readValidatedEntries(primitive)) {
      for (const segments of paths) {
        for (const value of collectPathValues(entry, segments)) {
          if (value == null) continue;
          const image = value as QinoImage;
          images.set(normalizeMediaUrl(image.src), image);
        }
      }
    }
  }

  const manifest: ImageManifest = {};
  for (const mediaPath of [...images.keys()].sort(compareCodeUnits)) {
    const { src: _, ...data } = images.get(mediaPath) as QinoImage;
    const size = await getFileSize(nodePath.join(mediaFolder, mediaPath));
    manifest[mediaPath] = { size, ...data };
  }

  return manifest;
}
