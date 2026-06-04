import nodePath from "node:path";

import { getConfig } from "../config";

export async function resolveTreeDirectory(directory: string) {
  const config = await getConfig();
  return nodePath.join(config.contentFolder, directory);
}
