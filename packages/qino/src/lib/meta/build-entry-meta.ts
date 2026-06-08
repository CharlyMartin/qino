import nodePath from "node:path";

import type { CollectionEntryMeta, SupportedFileExtension } from "../../types";
import { removeExtension } from "../../utils/remove-extension";

export type BuildMetaParams<Ext extends SupportedFileExtension> = {
  directory: string;
  relativePath: string;
  extension: Ext;
};

export function buildEntryMeta<Ext extends SupportedFileExtension>({
  directory,
  relativePath,
  extension,
}: BuildMetaParams<Ext>) {
  if (!relativePath.endsWith(extension)) {
    throw new Error(`${relativePath} does not end with ${extension}`);
  }

  return {
    slug: removeExtension(relativePath),
    fileName: nodePath.basename(relativePath) as `${string}${Ext}`,
    filePath: nodePath.join(directory, relativePath) as `${string}${Ext}`,
  } satisfies CollectionEntryMeta<Ext>;
}
