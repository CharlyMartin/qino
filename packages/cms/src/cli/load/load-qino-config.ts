import { createJiti } from "jiti";

import { ENTRY_FILE_NAME, ROOT_FOLDER_NAME } from "../../data/globals";
import { isQinoConfig } from "../../lib/guards/is-qino-config";

export async function loadQinoConfig(entryFilePath: string) {
  const jiti = createJiti(import.meta.url);

  const importedValue =
    await jiti.import<Record<string, unknown>>(entryFilePath);

  const config = importedValue.default;

  if (!isQinoConfig(config)) {
    throw new Error(
      `No createQino() instance found as the default export of "${ROOT_FOLDER_NAME}/${ENTRY_FILE_NAME}". ` +
        `Export it with \`export default createQino(...)\`.`,
    );
  }

  return config;
}
