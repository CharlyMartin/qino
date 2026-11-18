import fs from "node:fs";

import { observeFile } from "./observe-file";

/**
 * Reads a file's version with a sync stat, or `undefined` when it can't be
 * stat'd. Sync on purpose: under `next dev`, every async stat costs about 10×
 * more, and a listing checks thousands of files.
 */
export function readFileVersionSync(filePath: string) {
  try {
    const stats = fs.statSync(filePath, {
      bigint: true,
      throwIfNoEntry: false,
    });
    return stats && observeFile(stats, Date.now()).version;
  } catch {
    return undefined;
  }
}
