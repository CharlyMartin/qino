import nodePath from "node:path";

/**
 * Makes a configured folder relative to `cwd`, with `/` separators, so files
 * written for other machines (like `config.json`) never hold absolute paths.
 */
export function toPortablePath(path: string, cwd: string) {
  return (
    nodePath
      .relative(cwd, nodePath.resolve(cwd, path))
      .split(nodePath.sep)
      .join("/") || "."
  );
}
