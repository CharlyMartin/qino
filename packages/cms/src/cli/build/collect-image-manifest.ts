import nodePath from "node:path";

import { normalizeMediaUrl } from "@qino/tooling/media";
import { collectPathValues, parsePath } from "@qino/tooling/relations";

import { getFileSize } from "../../lib/fs/get-file-size";
import { getImageFieldPaths } from "../../lib/media/get-image-field-paths";
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
  const imagePrimitives = primitives
    .map((primitive) => ({
      primitive,
      paths: getImageFieldPaths(primitive).map(parsePath),
    }))
    .filter(({ paths }) => paths.length);

  if (imagePrimitives.length == 0) return undefined;

  const images = new Map<string, QinoImage>();
  for (const { primitive, paths } of imagePrimitives) {
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
