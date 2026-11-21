import { isPlainObject } from "es-toolkit";

import type { ImageManifest } from "../../types/media";
import type { DependencyCollector } from "../cache/create-dependency-collector";
import { createFileCache } from "../cache/create-file-cache";

// One per process, like decoded images: reloaded when `qino build` rewrites it.
const fileCache = createFileCache();

/**
 * Reads the image manifest `qino build` wrote. `dependencies` records it, as
 * an entry whose images come from it changes with it. `undefined` when there's
 * none.
 */
export async function readImageManifest(
  manifestPath: string,
  dependencies?: DependencyCollector,
) {
  try {
    return await fileCache.read(
      manifestPath,
      async (data) => {
        try {
          const manifest: unknown = JSON.parse(data);
          if (isPlainObject(manifest)) return manifest as ImageManifest;
        } catch {}
        throw new Error(
          `"${manifestPath}" isn't a valid image manifest. Run \`qino build\` to write it again.`,
        );
      },
      dependencies,
    );
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException)?.code == "ENOENT") return undefined;
    throw cause;
  }
}
