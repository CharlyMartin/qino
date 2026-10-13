import nodePath from "node:path";

import { GENERATED_DIR_NAME, ROOT_FOLDER_NAME } from "../../data/globals";

export function getGeneratedFilePath(fileName: string) {
  return nodePath.join(
    process.cwd(),
    ROOT_FOLDER_NAME,
    GENERATED_DIR_NAME,
    fileName,
  );
}
