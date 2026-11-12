import fs from "node:fs/promises";
import nodePath from "node:path";

import {
  extractMediaCandidates,
  isLocalMediaUrl,
  normalizeMediaUrl,
} from "@qino/tooling/media";
import { collectPathValues, parsePath } from "@qino/tooling/relations";
import { lookup } from "mrmime";

import {
  MARKDOWN_FIELD_NAME,
  MARKDOWN_MEDIA_KEY,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
} from "../../data/globals";
import { describeMediaMismatch } from "../../lib/media/describe-media-mismatch";
import { applyParse } from "../../lib/parse/apply-parse";
import type { MediaParse } from "../../types/media";
import type { AnyPrimitive } from "../../types/utils";
import { getPrimitiveId } from "../build/get-primitive-id";
import { serializeMedia } from "../build/serialize-media";
import { readValidatedEntries } from "./read-validated-entries";

type Rule = { accepted: string; maxSize: number };
type BodyRule = Rule & { parse: MediaParse | undefined };
type MediaViolation = {
  file: string;
  location: string;
  url: string;
  reason: string;
};

/**
 * Lists media files that break a primitive's `media` rules: a field value
 * outside `mediaFolder`, or a field value or body image of another type or
 * over `maxSize`. Body images must match one `markdown.media` rule, each
 * reading the image with its own `parse`.
 */
export async function findMediaViolations(
  primitive: AnyPrimitive,
  mediaFolder: string,
) {
  const { media: fieldConfig, markdown } = primitive[QinoPrimitiveMarker];
  const media = serializeMedia(
    fieldConfig,
    markdown.media,
    getPrimitiveId(primitive),
  ) as Record<string, Rule | Array<Rule>>;
  const { [MARKDOWN_MEDIA_KEY]: markdownRules = [], ...fields } = media;
  // `serializeMedia` writes `customFormat` in place of `parse`; rules keep
  // their order.
  const bodyRules: Array<BodyRule> = (markdownRules as Array<Rule>).map(
    (rule, index) => ({ ...rule, parse: markdown.media[index]?.parse }),
  );

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

    if (bodyRules.length) {
      const raw = await fs.readFile(file, "utf-8");
      const images = extractMediaCandidates(raw, nodePath.extname(file))
        .filter(({ image }) => image)
        .sort((a, b) => a.line - b.line);
      const seen = new Set<string>();

      for (const { url: value, line } of images) {
        const key = `${line}:${value}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const violation = await checkBodyImage(value, file);
        if (violation) {
          violations.push({
            file,
            location: `line ${line}`,
            url: violation.url,
            reason: violation.reason,
          });
        }
      }
    }
  }

  return violations;

  /**
   * Each rule reads `value` with its own `parse`; rules reading the same URL
   * are checked together. Passes when one URL matches its rules, and skips
   * values no rule reads as a URL in `mediaFolder`.
   */
  async function checkBodyImage(value: string, file: string) {
    const rulesByUrl = new Map<string, Array<Rule>>();

    for (const { parse, ...rule } of bodyRules) {
      const url = applyParse({
        value,
        parse,
        ctx: {
          sourceFilePath: file,
          fieldPath: MARKDOWN_FIELD_NAME,
          mediaFolder,
        },
        owner: `${file}: markdown.media`,
      });
      if (!isLocalMediaUrl(url)) continue;

      const normalized = normalizeMediaUrl(url);
      rulesByUrl.set(normalized, [...(rulesByUrl.get(normalized) ?? []), rule]);
    }

    let first: Pick<MediaViolation, "url" | "reason"> | undefined;
    for (const [url, rules] of rulesByUrl) {
      const reason = await check(url, rules);
      if (!reason) return;
      first ??= { url, reason };
    }

    return first;
  }
}
