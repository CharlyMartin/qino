import { configFileSchema } from "../schema/config-file";

/**
 * Validates the content of a generated `config.json`, already JSON-parsed.
 * Throws a `ZodError` on an invalid file or an unsupported `version`.
 */
export function parseConfigFile(json: unknown) {
  return configFileSchema.parse(json);
}
