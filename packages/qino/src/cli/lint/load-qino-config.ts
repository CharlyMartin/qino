import { createJiti } from "jiti";

import { ENTRY_FILE_NAME } from "../../data";
import { isQinoConfig } from "../../utils/is-qino-config";

// Maybe switch to default export for the config, since we expect only one export?
// fiti: { default: true },

export async function loadQinoConfig(entryFilePath: string) {
  const jiti = createJiti(import.meta.url);

  const importedValue =
    await jiti.import<Record<string, unknown>>(entryFilePath);

  const configs = Object.values(importedValue).filter(isQinoConfig);

  if (configs.length == 0) {
    throw new Error(
      `No createQino() instance exported from "${ENTRY_FILE_NAME}". Export one to provide instance here, but not more than one, this is not a circus!`,
    );
  }

  if (configs.length > 1) {
    throw new Error(
      `Multiple createQino() instances exported from "${ENTRY_FILE_NAME}". Export only one, you crazy mad(wo)man!`,
    );
  }

  return configs[0];
}
