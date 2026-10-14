import type { CloudMediaType } from "../../types/cloud";
import { parseSize } from "./parse-size";

const MIME_TYPE_PATTERN = /^(\*|[\w.+-]+)\/(\*|[\w.+-]+)$/;

/**
 * Describes an `accepted` list in `config.json`, with `maxSize` in bytes.
 * Fails on a `type` that isn't a MIME type (wildcards allowed), or a
 * `maxSize` outside 50–950KB in steps of 50, or 1–100MB.
 */
export function serializeAcceptedMedia(
  accepted: ReadonlyArray<CloudMediaType>,
  owner: string,
) {
  return accepted.map(({ type, maxSize }) => {
    if (!MIME_TYPE_PATTERN.test(type)) {
      throw new Error(
        `media.accepted type "${type}" of ${owner} isn't a MIME type, e.g. "image/webp" or "image/*".`,
      );
    }

    const bytes = parseSize(maxSize);
    if (bytes == undefined) {
      throw new Error(
        `media.accepted maxSize "${maxSize}" of "${type}" in ${owner} must be 50–950KB in steps of 50, or 1–100MB.`,
      );
    }

    return { type, maxSize: bytes };
  });
}
