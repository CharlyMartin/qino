import fs from "node:fs/promises";
import nodePath from "node:path";

import { parsePath } from "@qino/tooling/relations";
import { lookup } from "mrmime";

import type { AnyMediaConfig } from "../../types/media";
import { applyParse } from "../parse/apply-parse";
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
 * strings. A field's `parse` runs first, and its URL replaces the raw value.
 */
export async function resolveEntryMedia<Entry>({
  entry,
  media,
  mediaFolder,
  filePath,
}: ResolveEntryMediaParams<Entry>) {
  let value: unknown = entry;

  for (const [path, config] of Object.entries(media)) {
    if (config == undefined) continue;

    const { accepted, maxSize, parse } = config;
    const segments = parsePath(path);
    const parseLeaf = (leaf: string) =>
      applyParse({
        value: leaf,
        parse,
        ctx: { sourceFilePath: filePath, fieldPath: path, mediaFolder },
        owner: `${filePath}: media "${path}"`,
      });

    if (!isImageMediaType(accepted)) {
      if (parse) {
        value = await walkAndSet({
          value,
          segments,
          setLeaf: async (leaf) =>
            typeof leaf == "string" ? parseLeaf(leaf) : leaf,
        });
      }
      continue;
    }

    const maxBytes = parseSize(maxSize);
    if (maxBytes == undefined) {
      throw new Error(
        `${filePath}: media "${path}" has maxSize ${JSON.stringify(maxSize)}. Use 50–950KB in steps of 50, or 1–100MB.`,
      );
    }

    value = await walkAndSet({
      value,
      segments,
      async setLeaf(leaf) {
        if (leaf == null) return leaf;

        const url = typeof leaf == "string" ? parseLeaf(leaf) : leaf;
        const parsedFrom =
          url == leaf ? "" : ` (parsed from ${JSON.stringify(leaf)})`;
        const prefix = `${filePath}: media "${path}"${parsedFrom}`;
        if (typeof url != "string" || !isLocalMediaUrl(url)) {
          throw new Error(
            `${prefix} must be a URL in mediaFolder, starting with "/". Got ${JSON.stringify(url)}.`,
          );
        }

        const mediaPath = normalizeMediaUrl(url);
        const absolutePath = nodePath.join(mediaFolder, mediaPath);
        let mismatch: string | undefined;

        try {
          const { size } = await fs.stat(absolutePath);
          mismatch = describeMediaMismatch({
            type: lookup(mediaPath),
            size,
            rules: [{ accepted, maxSize: maxBytes }],
          });
          if (!mismatch) return await getImageData(absolutePath, url);
        } catch (cause) {
          const message =
            (cause as NodeJS.ErrnoException)?.code == "ENOENT"
              ? `"${url}" doesn't exist in "${mediaFolder}".`
              : cause instanceof Error
                ? cause.message
                : String(cause);
          throw new Error(`${prefix}: ${message}`, { cause });
        }

        throw new Error(`${prefix}: "${url}" ${mismatch}`);
      },
    });
  }

  return value as Entry;
}
