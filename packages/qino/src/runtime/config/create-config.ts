import { z } from "zod";

export const ConfigSchema = z.object({
  contentFolder: z.string(),
  mediaFolder: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function createConfig(config: Config) {
  return config;
}
