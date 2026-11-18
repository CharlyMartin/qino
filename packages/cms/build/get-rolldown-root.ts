import fs from "node:fs";
import { findPackageJSON } from "node:module";
import path from "node:path";

/**
 * The directory of the Rolldown that tsdown builds with, whose runtime helpers
 * end up in the bundle.
 */
export function getRolldownRoot() {
  const tsdown = findPackageJSON("tsdown", import.meta.url);
  // pnpm links tsdown's dependencies next to its real path.
  const rolldown =
    tsdown && findPackageJSON("rolldown", fs.realpathSync(tsdown));
  return rolldown ? path.dirname(fs.realpathSync(rolldown)) : undefined;
}
