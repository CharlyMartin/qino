import { getConfig } from "../config";
import nodePath from "node:path";

export async function resolveCollectionDirectory(relativePath: string) {
  const config = await getConfig();
  return nodePath.join(config.contentFolder, relativePath);
}
