import nodePath from "node:path";

type BuildMetaParams = {
  directory: string;
  relativePath: string;
  extension: string;
};

export function buildMeta({
  directory,
  relativePath,
  extension,
}: BuildMetaParams) {
  return {
    slug: relativePath.slice(0, -extension.length),
    fileName: nodePath.basename(relativePath),
    filePath: nodePath.join(directory, relativePath),
  };
}
