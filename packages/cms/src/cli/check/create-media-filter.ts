import nodePath from "node:path";

import picomatch from "picomatch";

export function createMediaFilter(exclude: ReadonlyArray<string> = []) {
  const isExcluded = exclude.length
    ? picomatch([...exclude], { dot: true })
    : () => false;

  // URLs without an extension, like `/blog/post`, are page links.
  return function isCheckedMedia(url: string) {
    return nodePath.posix.extname(url) != "" && !isExcluded(url);
  };
}
