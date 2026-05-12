import nodePath from "node:path";
import { getConfig } from "../config";
import type { SupportedFileExtension } from "../../types";

export async function resolveSingletonFile<Ext extends SupportedFileExtension>(
  file: `/${string}${Ext}`,
) {
  const config = await getConfig();
  return nodePath.join(config.contentFolder, file) as `${string}${Ext}`;
}
