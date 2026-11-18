import type { BigIntStats } from "node:fs";

import { RECENT_EDIT_MS } from "../../data/globals";

export type FileObservation = {
  /** `${ino}:${mtimeNs}:${size}`: changes when the file does, in practice. */
  version: string;
  /** Edited within `RECENT_EDIT_MS` of the stat, so `version` can't prove it unchanged. */
  untrusted: boolean;
};

/**
 * Describes a file from a stat taken before reading it. `observedAt` is the
 * time just before that stat.
 */
export function observeFile(stats: BigIntStats, observedAt: number) {
  return {
    version: `${stats.ino}:${stats.mtimeNs}:${stats.size}`,
    untrusted: observedAt - Number(stats.mtimeMs) < RECENT_EDIT_MS,
  } satisfies FileObservation;
}
