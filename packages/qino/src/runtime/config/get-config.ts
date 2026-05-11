import type { Config } from "./create-config";
import { loadConfig } from "./load-config";

let cached: Promise<Config> | undefined;

export function getConfig() {
  if (!cached) {
    cached = loadConfig().catch((err) => {
      cached = undefined;
      throw err;
    });
  }
  return cached;
}
