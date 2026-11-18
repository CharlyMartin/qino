import fs from "node:fs/promises";

import { lookup } from "mrmime";

import {
  BLUR_QUALITY,
  BLUR_SIZE,
  BLURRABLE_MEDIA_TYPES,
} from "../../data/globals";
import type { QinoImage } from "../../types/media";
import { createInFlightCache } from "../cache/create-in-flight-cache";
import { type FileObservation, observeFile } from "../cache/observe-file";
import { isImageMediaType } from "./is-image-media-type";

type ImageData = Omit<QinoImage, "src">;

// Entries share images across reads; a changed file gets a new key.
const cache = new Map<string, Promise<ImageData>>();
// Entries reading a just-edited image at once share its decode, kept only
// while it runs.
const recentDecodes = createInFlightCache();

/**
 * Reads an image's dimensions and, for JPEG, PNG, WebP, and AVIF, an 8px blur
 * placeholder, as Next does for static imports. sharp is only loaded here.
 * Pass the observation of a stat already taken, so the data matches the file
 * that stat describes. An image edited within 2s of it is decoded again.
 */
export async function getImageData(
  filePath: string,
  src: string,
  observation?: FileObservation,
) {
  const { version, untrusted } =
    observation ??
    observeFile(await fs.stat(filePath, { bigint: true }), Date.now());
  const key = `${filePath}:${version}`;

  if (untrusted) {
    // Its stats can't prove a cached decode matches, so it isn't kept either.
    cache.delete(key);
    const data = await recentDecodes.run(key, () => readImageData(filePath));
    return { src, ...data } satisfies QinoImage;
  }

  if (!cache.has(key)) {
    const data = readImageData(filePath);
    // A failed read is retried on the next call instead of cached.
    data.catch(() => cache.delete(key));
    cache.set(key, data);
  }

  const data = await (cache.get(key) as Promise<ImageData>);
  return { src, ...data } satisfies QinoImage;
}

async function readImageData(filePath: string) {
  const type = lookup(filePath);
  if (!isImageMediaType(type)) {
    throw new Error(`"${filePath}" isn't an image.`);
  }

  const { default: sharp } = await import("sharp");
  const { autoOrient } = await sharp(filePath).metadata();
  const { width, height } = autoOrient;

  if (!BLURRABLE_MEDIA_TYPES.includes(type as never)) {
    return { width, height } satisfies ImageData;
  }

  const ratio = (size: number, other: number) =>
    Math.max(Math.round((size / other) * BLUR_SIZE), 1);
  const blurWidth = width >= height ? BLUR_SIZE : ratio(width, height);
  const blurHeight = width >= height ? ratio(height, width) : BLUR_SIZE;

  const blur = await sharp(filePath)
    .autoOrient()
    .resize(blurWidth, blurHeight)
    .toFormat(type.slice("image/".length) as "avif" | "jpeg" | "png" | "webp", {
      quality: BLUR_QUALITY,
    })
    .toBuffer();

  return {
    width,
    height,
    blurDataURL: `data:${type};base64,${blur.toString("base64")}`,
    blurWidth,
    blurHeight,
  } satisfies ImageData;
}
