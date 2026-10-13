import fs from "node:fs/promises";

import {
  GENERATED_CONFIG_FILE_NAME,
  GENERATED_DIR_NAME,
  ROOT_FOLDER_NAME,
} from "../../data/globals";
import {
  type CreateConfigFileParams,
  createConfigFile,
} from "../build/create-config-file";
import { getGeneratedFilePath } from "../build/get-generated-file-path";

const DISPLAY_PATH = `${ROOT_FOLDER_NAME}/${GENERATED_DIR_NAME}/${GENERATED_CONFIG_FILE_NAME}`;

/**
 * Fails when the committed `config.json` doesn't match what `qino build`
 * would write, so CI catches schema changes that weren't rebuilt.
 */
export async function assertConfigFileFresh(params: CreateConfigFileParams) {
  const existing = await fs
    .readFile(getGeneratedFilePath(GENERATED_CONFIG_FILE_NAME), "utf-8")
    .catch(() => null);

  if (existing == null) {
    throw new Error(
      `"${DISPLAY_PATH}" not found. Run \`qino build\` and commit it.`,
    );
  }

  if (existing != createConfigFile(params)) {
    throw new Error(
      `"${DISPLAY_PATH}" is out of date. Run \`qino build\` and commit it.`,
    );
  }
}
