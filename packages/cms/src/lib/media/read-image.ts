import fs from "node:fs/promises";
import nodePath from "node:path";

import { normalizeMediaUrl } from "@qino/tooling/media";
import { lookup } from "mrmime";

import { ABSENT_FILE_VERSION } from "../../data/globals";
import type { QinoImage } from "../../types/media";
import type { DependencyCollector } from "../cache/create-dependency-collector";
import { observeFile } from "../cache/observe-file";
import { describeMediaMismatch } from "./describe-media-mismatch";
import { getImageData } from "./get-image-data";
import { getImageManifestPath } from "./get-image-manifest-path";
import { loadSharp } from "./load-sharp";
import { readImageManifest } from "./read-image-manifest";

type ImageRule = {
  accepted: string;
  /** In bytes. */
  maxSize: number;
};

type ReadImageParams = {
  /** A URL in `mediaFolder`, after the field's `parse`. */
  url: string;
  rule: ImageRule;
  mediaFolder: string;
  contentFolder: string;
  /** Records the file the image was read from, with the stat it was checked against. */
  dependencies?: DependencyCollector;
};

/**
 * Reads an image field's file as a `QinoImage`, once it passes the field's
 * rule. On a server that ships neither `mediaFolder` nor sharp's native
 * binary, an image missing from the first or that the second can't decode is
 * read from the image manifest `qino build` wrote instead.
 */
export async function readImage({
  url,
  rule,
  mediaFolder,
  contentFolder,
  dependencies,
}: ReadImageParams) {
  const mediaPath = normalizeMediaUrl(url);
  const absolutePath = nodePath.join(mediaFolder, mediaPath);
  const observedAt = Date.now();
  const stats = await fs
    .stat(absolutePath, { bigint: true })
    .catch((cause: NodeJS.ErrnoException) => {
      if (cause?.code == "ENOENT") return undefined;
      throw cause;
    });

  // One stat serves the rule and the decode, so they describe the same file.
  if (stats) {
    const observation = observeFile(stats, observedAt);
    dependencies?.record(absolutePath, observation);
    assertRule(Number(stats.size));
    const sharpError = await loadSharp().then(
      () => undefined,
      (error: unknown) => error ?? new Error("sharp can't load."),
    );
    if (!sharpError) return getImageData(absolutePath, url, observation);

    return readRecorded(`"${url}" can't be decoded: sharp can't load.`, {
      cause: sharpError,
    });
  }

  // Restoring the file changes its version, so a listing reads it again.
  dependencies?.record(absolutePath, {
    version: ABSENT_FILE_VERSION,
    untrusted: false,
  });
  return readRecorded(`"${url}" doesn't exist in "${mediaFolder}".`);

  /** Reads the image from the image manifest, or fails with `reason`. */
  async function readRecorded(reason: string, options?: ErrorOptions) {
    const manifestPath = getImageManifestPath(contentFolder);
    const manifest = await readImageManifest(manifestPath, dependencies);
    const recorded = manifest?.[mediaPath];
    if (!recorded) {
      throw new Error(
        `${reason} Nor does "${manifestPath}" record it: run \`qino build\` to record it.`,
        options,
      );
    }

    const { size, ...data } = recorded;
    assertRule(size);
    return { src: url, ...data } satisfies QinoImage;
  }

  function assertRule(size: number) {
    const mismatch = describeMediaMismatch({
      type: lookup(mediaPath),
      size,
      rules: [rule],
    });
    if (mismatch) throw new Error(`"${url}" ${mismatch}`);
  }
}
