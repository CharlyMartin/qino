import fs from "node:fs/promises";
import nodePath from "node:path";

import { lookup } from "mrmime";

import { MARKDOWN_MEDIA_KEY } from "../../data/globals";
import type { AnyMediaConfig, MediaFieldConfig } from "../../types/media";
import { parsePath } from "../relations/parse-path";
import { walkAndSet } from "../relations/walk-and-set";
import { describeMediaMismatch } from "./describe-media-mismatch";
import { getImageData } from "./get-image-data";
import { isImageMediaType } from "./is-image-media-type";
import { isLocalMediaUrl } from "./is-local-media-url";
import { normalizeMediaUrl } from "./normalize-media-url";
import { parseSize } from "./parse-size";

type ResolveEntryMediaParams<Entry> = {
  entry: Entry;
  media: AnyMediaConfig;
  mediaFolder: string;
  filePath: string;
};

/**
 * Replaces the URL of each image field with its `QinoImage`: dimensions and a
 * blur placeholder, read from `mediaFolder`. Fails when the file isn't of the
 * field's `accepted` type or is over its `maxSize`. Other media fields stay
 * strings.
 */
export async function resolveEntryMedia<Entry>({
  entry,
  media,
  mediaFolder,
  filePath,
}: ResolveEntryMediaParams<Entry>) {
  let value: unknown = entry;

  for (const [path, config] of Object.entries(media)) {
    // `markdown` is the only list; it checks the body in `qino check`.
    if (path == MARKDOWN_MEDIA_KEY || config == undefined) continue;

    const { accepted, maxSize } = config as MediaFieldConfig;
    if (!isImageMediaType(accepted)) continue;

    const maxBytes = parseSize(maxSize);
    if (maxBytes == undefined) {
      throw new Error(
        `${filePath}: media "${path}" has maxSize ${JSON.stringify(maxSize)}. Use 50–950KB in steps of 50, or 1–100MB.`,
      );
    }

    value = await walkAndSet({
      value,
      segments: parsePath(path),
      async setLeaf(leaf) {
        if (leaf == null) return leaf;

        const prefix = `${filePath}: media "${path}"`;
        if (typeof leaf != "string" || !isLocalMediaUrl(leaf)) {
          throw new Error(
            `${prefix} must be a URL in mediaFolder, starting with "/". Got ${JSON.stringify(leaf)}.`,
          );
        }

        const mediaPath = normalizeMediaUrl(leaf);
        const absolutePath = nodePath.join(mediaFolder, mediaPath);
        let mismatch: string | undefined;

        try {
          const { size } = await fs.stat(absolutePath);
          mismatch = describeMediaMismatch({
            type: lookup(mediaPath),
            size,
            rules: [{ accepted, maxSize: maxBytes }],
          });
          if (!mismatch) return await getImageData(absolutePath, leaf);
        } catch (cause) {
          const message =
            (cause as NodeJS.ErrnoException)?.code == "ENOENT"
              ? `"${leaf}" doesn't exist in "${mediaFolder}".`
              : cause instanceof Error
                ? cause.message
                : String(cause);
          throw new Error(`${prefix}: ${message}`, { cause });
        }

        throw new Error(`${prefix}: "${leaf}" ${mismatch}`);
      },
    });
  }

  return value as Entry;
}
