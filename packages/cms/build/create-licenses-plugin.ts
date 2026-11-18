import type { Rolldown } from "tsdown";

import { formatThirdPartyLicenses } from "./format-third-party-licenses";
import { getPackageRoot } from "./get-package-root";
import { getRolldownRoot } from "./get-rolldown-root";

const ROLLDOWN_RUNTIME = "\0rolldown/runtime.js";

/**
 * Writes `THIRD-PARTY-LICENSES.md` next to the bundle, with the license of
 * every package it copies code from.
 */
export function createLicensesPlugin() {
  return {
    name: "qino:third-party-licenses",
    generateBundle(_options, bundle) {
      const roots = new Set<string>();
      for (const output of Object.values(bundle)) {
        if (output.type != "chunk") continue;
        for (const moduleId of output.moduleIds) {
          // The runtime's helpers, such as `__toESM`, come from Rolldown.
          const root =
            moduleId == ROLLDOWN_RUNTIME
              ? getRolldownRoot()
              : getPackageRoot(moduleId);
          if (root) roots.add(root);
        }
      }

      this.emitFile({
        type: "asset",
        fileName: "THIRD-PARTY-LICENSES.md",
        source: formatThirdPartyLicenses(roots),
      });
    },
  } satisfies Rolldown.Plugin;
}
