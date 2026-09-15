import nodePath from "node:path";

import type { ItemEntryMeta } from "../../types/item";
import type { SupportedFileExtension } from "../../types/utils";

type BuildItemMetaParams<Ext extends SupportedFileExtension> = {
  filePath: `${string}${Ext}`;
};

export function buildItemMeta<Ext extends SupportedFileExtension>({
  filePath,
}: BuildItemMetaParams<Ext>) {
  return {
    fileName: nodePath.basename(filePath) as `${string}${Ext}`,
    filePath: filePath as `${string}${Ext}`,
  } satisfies ItemEntryMeta<Ext>;
}
