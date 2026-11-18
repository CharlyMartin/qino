import type { FileObservation } from "./observe-file";
import { readFileVersionSync } from "./read-file-version-sync";

/**
 * Whether every file an entry was built from is still as observed. A file
 * observed within 2s of an edit counts as changed, since its stats can't prove
 * otherwise. `versions` keeps each file's version for the call, so files that
 * many entries share are stat'd once.
 */
export function hasUnchangedFiles(
  dependencies: Map<string, FileObservation>,
  versions: Map<string, string | undefined>,
) {
  for (const [filePath, observation] of dependencies) {
    if (observation.untrusted) return false;
    if (!versions.has(filePath)) {
      versions.set(filePath, readFileVersionSync(filePath));
    }
    if (versions.get(filePath) != observation.version) return false;
  }
  return true;
}
