import fg from "fast-glob";

import type { SupportedFileExtension } from "../../types";

type GetRelativePathsParams = {
  absoluteDirPath: string;
  extension: SupportedFileExtension;
};
// Glog flac collection paths
export async function globCollectionPaths({
  absoluteDirPath,
  extension,
}: GetRelativePathsParams) {
  // `*.md`, NOT `**/*.md` -> collections are flat directories, not nested like trees.
  const relativeFilePaths = await fg(`*${extension}`, {
    cwd: absoluteDirPath,
  });

  return relativeFilePaths;
}
