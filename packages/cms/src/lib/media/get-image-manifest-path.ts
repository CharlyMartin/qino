import nodePath from "node:path";

import {
  IMAGE_MANIFEST_DIR_NAME,
  IMAGE_MANIFEST_FILE_NAME,
} from "../../data/globals";

/**
 * Inside the content folder, so it ships wherever a deploy already ships
 * content for request-time reads.
 */
export function getImageManifestPath(contentFolder: string) {
  return nodePath.join(
    contentFolder,
    IMAGE_MANIFEST_DIR_NAME,
    IMAGE_MANIFEST_FILE_NAME,
  );
}
