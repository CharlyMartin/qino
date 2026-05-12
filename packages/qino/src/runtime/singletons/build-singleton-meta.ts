import nodePath from "node:path";
import type { SingletonEntryMeta, SupportedFileExtension } from "../../types";

type BuildSingletonMetaParams<Ext extends SupportedFileExtension> = {
  filePath: `${string}${Ext}`;
};

export function buildSingletonMeta<Ext extends SupportedFileExtension>({
  filePath,
}: BuildSingletonMetaParams<Ext>) {
  return {
    fileName: nodePath.basename(filePath) as `${string}${Ext}`,
    filePath: filePath as `${string}${Ext}`,
  } satisfies SingletonEntryMeta<Ext>;
}
