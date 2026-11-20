import { consola } from "consola";

import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { generateConfigFile } from "./generate-config-file";
import { generateTypes } from "./generate-types";
import { writeLlmsTxt } from "./write-llms-txt";

type BuildParams = {
  context: QinoContext;
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

type BuildOptions = {
  /** Whether `check` verified `config.json`, which then stays as is. */
  isConfigFileChecked?: boolean;
};

export async function build(
  { context, collections, items, trees }: BuildParams,
  { isConfigFileChecked = false }: BuildOptions = {},
) {
  if (context.cli?.build?.types == false) {
    consola.info("Types generation skipped: `cli.build.types` is false.");
  } else {
    await generateTypes({ collections, trees });
  }

  if (context.cloud && !isConfigFileChecked) {
    await generateConfigFile({ context, collections, items, trees });
  }

  await writeLlmsTxt({ context, collections, items, trees });
}
