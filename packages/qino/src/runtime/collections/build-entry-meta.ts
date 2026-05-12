import nodePath from "node:path";

import type { EntryMeta, SupportedFileExtension } from "../../types";

type BuildMetaParams<Ext extends SupportedFileExtension> = {
  directory: string;
  relativePath: string;
  extension: Ext;
};

export function buildEntryMeta<Ext extends SupportedFileExtension>({
  directory,
  relativePath,
  extension,
}: BuildMetaParams<Ext>) {
  return {
    slug: relativePath.slice(0, -extension.length),
    fileName: nodePath.basename(relativePath) as `${string}${Ext}`,
    filePath: nodePath.join(directory, relativePath) as `${string}${Ext}`,
  } satisfies EntryMeta<Ext>;
}
