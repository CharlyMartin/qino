import { join } from "node:path";

import { ENTRY_FILE_NAME } from "../../data/globals";
import { assertFile } from "../../lib/fs/assert-file";

export function getEntryFilePath(rootDirPath: string) {
  const entryFilePath = join(rootDirPath, ENTRY_FILE_NAME);

  assertFile(
    entryFilePath,
    `"${ENTRY_FILE_NAME}" file not found at "${entryFilePath}"`,
  );

  return entryFilePath;
}
