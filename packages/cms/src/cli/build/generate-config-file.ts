import { GENERATED_CONFIG_FILE_NAME } from "../../data/globals";
import {
  type CreateConfigFileParams,
  createConfigFile,
} from "./create-config-file";
import { getGeneratedFilePath } from "./get-generated-file-path";
import { writeGeneratedFile } from "./write-generated-file";

/**
 * Writes `qino/_generated/config.json`, only when its content changed.
 */
export async function generateConfigFile(params: CreateConfigFileParams) {
  return writeGeneratedFile(
    getGeneratedFilePath(GENERATED_CONFIG_FILE_NAME),
    createConfigFile(params),
  );
}
