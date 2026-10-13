import fs from "node:fs/promises";
import nodePath from "node:path";

import fg from "fast-glob";

import { SUPPORTED_CONTENT_EXTENSIONS } from "../../data/globals";
import { isFile } from "../../lib/fs/is-file";
import type { QinoConfig } from "../../runtime/qino/init-qino";
import { createMediaFilter } from "./create-media-filter";
import { extractMediaLinks } from "./extract-media-links";

export async function findMissingMedia({
  contentFolder,
  mediaFolder,
  checkLocalAssetReferences,
}: QinoConfig) {
  const isCheckedMedia = createMediaFilter(
    typeof checkLocalAssetReferences == "object"
      ? checkLocalAssetReferences.exclude
      : [],
  );
  const contentExtensions = SUPPORTED_CONTENT_EXTENSIONS.map((ext) =>
    ext.slice(1),
  );
  const files = await fg(`**/*.{${contentExtensions.join(",")}}`, {
    cwd: contentFolder,
    absolute: true,
  });

  // Many entries share the same asset, so only stat each path once.
  const existence = new Map<string, Promise<boolean>>();

  function exists(url: string) {
    const filePath = nodePath.join(mediaFolder, url);

    if (!existence.has(filePath)) {
      existence.set(filePath, isFile(filePath));
    }

    return existence.get(filePath) as Promise<boolean>;
  }

  const results = await Promise.all(
    files.sort().map(async (file) => {
      try {
        const raw = await fs.readFile(file, "utf-8");
        const links = extractMediaLinks(raw, nodePath.extname(file)).filter(
          ({ url }) => isCheckedMedia(url),
        );
        const checked = await Promise.all(
          links.map(async (link) => ({
            ...link,
            file,
            found: await exists(link.url),
          })),
        );

        return checked.filter(({ found }) => !found);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Could not scan "${file}" for media: ${message}`, {
          cause: cause instanceof Error ? cause : undefined,
        });
      }
    }),
  );

  return results.flat().map(({ file, line, url }) => ({ file, line, url }));
}
