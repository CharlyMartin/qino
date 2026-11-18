import type { FileObservation } from "./observe-file";

export type DependencyCollector = ReturnType<typeof createDependencyCollector>;

/**
 * Collects every file an entry is built from, each with the observation of the
 * stat taken before it was read. An entry built from a file whose stat failed,
 * or from two different versions of one file, can't be proven unchanged, so
 * the collector marks it as not reusable.
 */
export function createDependencyCollector() {
  const observations = new Map<string, FileObservation>();
  let reusable = true;

  return { record, merge, markUnreusable, observations, isReusable };

  /** Records a file read. Pass no observation when its stat failed. */
  function record(filePath: string, observation?: FileObservation) {
    if (!observation) {
      reusable = false;
      return;
    }

    const previous = observations.get(filePath);
    if (!previous) {
      observations.set(filePath, observation);
      return;
    }

    if (previous.version != observation.version) reusable = false;
    if (observation.untrusted && !previous.untrusted) {
      observations.set(filePath, { ...previous, untrusted: true });
    }
  }

  /** Records every file another collector saw, such as a shared target read. */
  function merge(other: DependencyCollector) {
    if (!other.isReusable()) reusable = false;
    for (const [filePath, observation] of other.observations) {
      record(filePath, observation);
    }
  }

  function markUnreusable() {
    reusable = false;
  }

  function isReusable() {
    return reusable;
  }
}
