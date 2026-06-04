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

  const fileName = nodePath.basename(relativePath);

  return {
    slug: removeExtension(fileName),
    fileName: fileName as `${string}${Ext}`,
    filePath: nodePath.join(directory, fileName) as `${string}${Ext}`,
  } satisfies CollectionEntryMeta<Ext>;
}
