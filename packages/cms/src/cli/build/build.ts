import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { generateConfigFile } from "./generate-config-file";
import { generateTypes } from "./generate-types";

type BuildParams = {
  context: QinoContext;
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

export async function build({
  context,
  collections,
  items,
  trees,
}: BuildParams) {
  await generateTypes({ collections, trees });

  if (context.buildConfigFile) {
    await generateConfigFile({ context, collections, items, trees });
  }
}
