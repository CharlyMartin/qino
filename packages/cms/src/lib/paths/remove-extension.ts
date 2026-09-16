import nodePath from "node:path";

export function removeExtension(path: string) {
  const ext = nodePath.extname(path);
  return ext ? path.slice(0, -ext.length) : path;
}
