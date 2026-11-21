import nodePath from "node:path";

import { getImageManifestPath } from "../../lib/media/get-image-manifest-path";
import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { collectImageManifest } from "./collect-image-manifest";
import { writeGeneratedFile } from "./write-generated-file";

type GenerateImageManifestParams = {
  context: QinoContext;
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

/**
 * Writes the image manifest, which request-time reads fall back to on servers
 * without `mediaFolder` or sharp's native binary, and a `.gitignore` beside it:
 * every build writes it again, so it's never committed. Writes nothing when no
 * primitive has an image field.
 */
export async function generateImageManifest({
  context,
  collections,
  items,
  trees,
}: GenerateImageManifestParams) {
  const manifest = await collectImageManifest(
    [...collections, ...items, ...trees],
    context.mediaFolder,
  );
  if (!manifest) return;

  const manifestPath = getImageManifestPath(context.contentFolder);
  await writeGeneratedFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeGeneratedFile(
    nodePath.join(nodePath.dirname(manifestPath), ".gitignore"),
    "*\n",
  );
}
