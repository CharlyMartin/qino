import fs from "node:fs/promises";

import { limitAsync } from "es-toolkit";

import { MAX_CONCURRENT_FILE_READS } from "../../data/globals";

/**
 * Reads a UTF-8 file. Every call shares one cap on reads in progress, so a
 * walk or listing that starts thousands of reads at once can't run out of open
 * files. It only wraps the read itself, so a caller can't wait on another one.
 */
export const readTextFile = limitAsync(
  (filePath: string) => fs.readFile(filePath, "utf-8"),
  MAX_CONCURRENT_FILE_READS,
);
