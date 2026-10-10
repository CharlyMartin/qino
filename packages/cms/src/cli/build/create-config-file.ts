import { version as qinoVersion } from "../../../package.json";
import { CONFIG_FILE_VERSION } from "../../data/globals";
import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { assertRelationTargetsDiscovered } from "./assert-relation-targets-discovered";
import { serializePrimitives } from "./serialize-primitives";
import { toPortablePath } from "./to-portable-path";

export type CreateConfigFileParams = {
  context: QinoContext;
  collections?: Array<AnyCollection>;
  items?: Array<AnyItem>;
  trees?: Array<AnyTree>;
};

/**
 * Serializes `config.json`, the project description read by the Qino cloud
 * UI: config, primitives, JSON Schemas, and relations. Deterministic (sorted,
 * pretty-printed) so it diffs cleanly once committed.
 */
export function createConfigFile({
  context,
  collections = [],
  items = [],
  trees = [],
}: CreateConfigFileParams) {
  assertRelationTargetsDiscovered([...collections, ...items, ...trees]);

  const cwd = process.cwd();
  const config = {
    version: CONFIG_FILE_VERSION,
    qinoVersion,
    config: {
      contentFolder: toPortablePath(context.contentFolder, cwd),
      mediaFolder: toPortablePath(context.mediaFolder, cwd),
    },
    collections: serializePrimitives(collections),
    items: serializePrimitives(items),
    trees: serializePrimitives(trees),
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}
