import { z } from "zod";

import { configV1Schema } from "./config-v1";

/** `config.json`, any supported version. Dispatches on `version`. */
export const configFileSchema = z.discriminatedUnion(
  "version",
  [configV1Schema],
  { error: "Unsupported config.json version: upgrade @qino/tooling." },
);

export type ConfigFile = z.infer<typeof configFileSchema>;
