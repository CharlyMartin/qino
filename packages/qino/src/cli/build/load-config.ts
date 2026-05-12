import { createJiti } from "jiti";
import { ConfigSchema, type Config } from "../../runtime";
import { z } from "zod";

export async function loadConfig(configPath: string): Promise<Config> {
  const jiti = createJiti(import.meta.url);
  const mod = (await jiti.import(configPath)) as { default?: unknown };
  if (!mod || typeof mod != "object" || !mod.default) {
    throw new Error("qino/config.ts must default-export createConfig({...})");
  }
  const result = ConfigSchema.safeParse(mod.default);
  if (!result.success) {
    throw new Error(
      `Invalid config in ${configPath}.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
