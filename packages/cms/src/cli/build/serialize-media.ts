import { MARKDOWN_MEDIA_KEY } from "../../data/globals";
import { parseSize } from "../../lib/media/parse-size";
import type { AnyMediaConfig } from "../../types/media";
import { assertMediaType } from "./assert-media-type";

/**
 * Describes a primitive's `media` in `config.json`, with `maxSize` in bytes.
 * Fails on a field or `markdown` rule whose `accepted` isn't one known MIME
 * type, or a `maxSize` outside 50–950KB in steps of 50, or 1–100MB.
 */
export function serializeMedia(media: AnyMediaConfig, primitiveId: string) {
  return Object.fromEntries(
    Object.entries(media)
      .filter(([, config]) => config != undefined)
      .map(([path, config]) => {
        const owner = `media "${path}" of "${primitiveId}"`;

        if (path != MARKDOWN_MEDIA_KEY) {
          return [path, serializeRule(config, owner)];
        }

        if (!Array.isArray(config)) {
          throw new Error(`${owner} must be a list of rules.`);
        }

        return [
          path,
          config.map((rule, index) =>
            serializeRule(rule, `${owner}, rule ${index + 1},`),
          ),
        ];
      }),
  );
}

function serializeRule(rule: unknown, owner: string) {
  const { accepted, maxSize } = rule as { [K: string]: unknown };
  assertMediaType(accepted, owner);
  return { accepted, maxSize: toBytes(maxSize, owner) };
}

function toBytes(maxSize: unknown, owner: string) {
  const bytes = typeof maxSize == "string" ? parseSize(maxSize) : undefined;

  if (bytes == undefined) {
    throw new Error(
      `${owner} has maxSize ${JSON.stringify(maxSize)}. Use 50–950KB in steps of 50, or 1–100MB.`,
    );
  }

  return bytes;
}
