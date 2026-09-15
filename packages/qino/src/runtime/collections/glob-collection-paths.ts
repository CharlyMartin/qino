import fg from "fast-glob";

import type { SupportedFileExtension } from "../../types/utils";

type GetRelativePathsParams = {
  absoluteDirPath: string;
  extension: SupportedFileExtension;
};

export async function globCollectionPaths({
  absoluteDirPath,
  extension,
}: GetRelativePathsParams) {
  // `*${extension}`, NOT `**/*${extension}` -> collections are flat directories, not nested like trees.
  const relativeFilePaths = await fg(`*${extension}`, {
    cwd: absoluteDirPath,
  });

  return relativeFilePaths;
}
