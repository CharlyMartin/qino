import { mimes } from "mrmime";

const KNOWN_MEDIA_TYPES = new Set(Object.values(mimes));

/**
 * Fails unless `type` is an exact, known MIME type such as `"image/webp"`:
 * no wildcards, so `qino check` and the cloud UI match files by extension.
 */
export function assertMediaType(type: unknown, owner: string) {
  if (typeof type != "string" || !KNOWN_MEDIA_TYPES.has(type)) {
    throw new Error(
      `${owner} accepts ${JSON.stringify(type)}, which isn't a known MIME type. Use an exact type, e.g. "image/webp".`,
    );
  }
}
