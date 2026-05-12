import nodePath from "node:path";

import type { SupportedFileExtension } from "../../types";
import { getConfig } from "../config";

export async function resolveSingletonFile<Ext extends SupportedFileExtension>(
  file: `/${string}${Ext}`,
) {
  const config = await getConfig();
  return nodePath.join(config.contentFolder, file) as `${string}${Ext}`;
}
