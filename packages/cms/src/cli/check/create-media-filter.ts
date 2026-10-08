import nodePath from "node:path";

import picomatch from "picomatch";

import type { QinoMediaConfig } from "../../runtime/qino/init-qino";

type CreateMediaFilterParams = Pick<QinoMediaConfig, "extensions" | "ignore">;

export function createMediaFilter({
  extensions = [],
  ignore = [],
}: CreateMediaFilterParams) {
  const allowed = new Set(
    extensions.map((ext) => ext.replace(/^\./u, "").toLowerCase()),
  );

  const isIgnored = ignore.length
    ? picomatch([...ignore], { dot: true })
    : () => false;

  return function isCheckedMedia(url: string) {
    const extension = nodePath.posix.extname(url).slice(1).toLowerCase();
    return allowed.has(extension) && !isIgnored(url);
  };
}
