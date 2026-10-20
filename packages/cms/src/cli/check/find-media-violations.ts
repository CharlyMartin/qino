import fs from "node:fs/promises";
import nodePath from "node:path";

import { lookup } from "mrmime";

import {
  MARKDOWN_MEDIA_KEY,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
} from "../../data/globals";
import { describeMediaMismatch } from "../../lib/media/describe-media-mismatch";
import { isLocalMediaUrl } from "../../lib/media/is-local-media-url";
import { normalizeMediaUrl } from "../../lib/media/normalize-media-url";
import { parsePath } from "../../lib/relations/parse-path";
import type { AnyPrimitive } from "../../types/utils";
import { getPrimitiveId } from "../build/get-primitive-id";
import { serializeMedia } from "../build/serialize-media";
import { collectPathValues } from "./collect-path-values";
import { extractMediaLinks } from "./extract-media-links";
import { readValidatedEntries } from "./read-validated-entries";

type Rule = { accepted: string; maxSize: number };
type MediaViolation = {
  file: string;
  location: string;
  url: string;
  reason: string;
};

/**
 * Lists media files that break a primitive's `media` rules: a field value
 * outside `mediaFolder`, or a field value or body image of another type or
 * over `maxSize`. Body images must match one `markdown` rule.
 */
export async function findMediaViolations(
  primitive: AnyPrimitive,
  mediaFolder: string,
) {
  const media = serializeMedia(
    primitive[QinoPrimitiveMarker].media,
    getPrimitiveId(primitive),
  ) as Record<string, Rule | Array<Rule>>;
  const { [MARKDOWN_MEDIA_KEY]: markdownRules, ...fields } = media;

  if (Object.keys(media).length == 0) return [];

  // Many entries share the same file, so only stat each path once.
  const sizes = new Map<string, Promise<number | undefined>>();

  function getSize(path: string) {
    const filePath = nodePath.join(mediaFolder, path);

    if (!sizes.has(filePath)) {
      sizes.set(
        filePath,
        fs.stat(filePath).then(
          ({ size }) => size,
          () => undefined,
        ),
      );
    }

    return sizes.get(filePath) as Promise<number | undefined>;
  }

  // `path` is the URL normalized: without query or hash, and decoded.
  async function check(path: string, rules: ReadonlyArray<Rule>) {
    const size = await getSize(path);
    if (size == undefined) return `doesn't exist in "${mediaFolder}".`;

    return describeMediaMismatch({ type: lookup(path), size, rules });
  }

  const violations: Array<MediaViolation> = [];

  for (const entry of await readValidatedEntries(primitive)) {
    const file = entry[META_FIELD_NAME].filePath;

    for (const [path, rule] of Object.entries(fields)) {
      for (const value of collectPathValues(entry, parsePath(path))) {
        if (value == null) continue;

        // Image fields are read as `QinoImage`; others stay URLs.
        const url = String(
          typeof value == "object" ? (value as { src: unknown }).src : value,
        );
        const reason = isLocalMediaUrl(url)
          ? await check(normalizeMediaUrl(url), [rule as Rule])
          : 'must be a URL in mediaFolder, starting with "/".';
        if (reason) violations.push({ file, location: path, url, reason });
      }
    }

    if (Array.isArray(markdownRules)) {
      const raw = await fs.readFile(file, "utf-8");
      const images = extractMediaLinks(raw, nodePath.extname(file)).filter(
        ({ image }) => image,
      );

      // Already local and normalized by `extractMediaLinks`.
      for (const { url, line } of images) {
        const reason = await check(url, markdownRules);
        if (reason) {
          violations.push({ file, location: `line ${line}`, url, reason });
        }
      }
    }
  }

  return violations;
}
