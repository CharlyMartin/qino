import { MARKDOWN_MEDIA_KEY } from "../../data/globals";
import { parseSize } from "../../lib/media/parse-size";
import type { AnyMediaConfig, MediaRule } from "../../types/media";
import { assertMediaType } from "./assert-media-type";

/**
 * Describes a primitive's `media` in `config.json`, with `maxSize` in bytes
 * and `markdown.media` listed under `markdown`. `parse` is left out. Fails on
 * a rule whose `accepted` isn't one known MIME type, or a `maxSize` outside
 * 50–950KB in steps of 50, or 1–100MB.
 */
export function serializeMedia(
  media: AnyMediaConfig,
  markdownMedia: ReadonlyArray<MediaRule>,
  primitiveId: string,
) {
  const fields = Object.entries(media)
    .filter(([, rule]) => rule != undefined)
    .map(([path, rule]) => [
      path,
      serializeRule(rule, `media "${path}" of "${primitiveId}"`),
    ]);

  if (markdownMedia.length == 0) return Object.fromEntries(fields);

  const markdown = markdownMedia.map((rule, index) =>
    serializeRule(
      rule,
      `markdown.media of "${primitiveId}", rule ${index + 1},`,
    ),
  );
  return Object.fromEntries([...fields, [MARKDOWN_MEDIA_KEY, markdown]]);
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
