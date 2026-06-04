import nodePath from "node:path";

export function removeExtension(path: string) {
  return nodePath.parse(path).name;
}
