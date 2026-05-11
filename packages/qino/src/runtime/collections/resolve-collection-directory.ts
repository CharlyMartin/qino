import { getConfig } from "../config";
import nodePath from "node:path";

export async function resolveCollectionDirectory(directory: string) {
  const config = await getConfig();
  return nodePath.join(config.contentFolder, directory);
}
