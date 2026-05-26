import { createJiti } from "jiti";
import { z } from "zod";

import { type Config, ConfigSchema } from "../../runtime";

export async function loadConfig(configPath: string): Promise<Config> {
  const jiti = createJiti(import.meta.url);
  const imported = await jiti.import(configPath);

  if (!imported || typeof imported != "object" || !("default" in imported)) {
    throw new Error("qino/config.ts must export default createConfig({...})");
  }

  const result = ConfigSchema.safeParse(imported.default);

  if (!result.success) {
    throw new Error(
      `Invalid config in ${configPath}.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
