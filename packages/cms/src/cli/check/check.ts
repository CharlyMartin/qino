import { consola } from "consola";

import { QinoPrimitiveMarker } from "../../data/globals";
import { getImageFieldPaths } from "../../lib/media/get-image-field-paths";
import { loadSharp } from "../../lib/media/load-sharp";
import type { Loaded } from "../load/load";
import { assertConfigFileFresh } from "./assert-config-file-fresh";
import { assertInputValuesMatch } from "./assert-input-values-match";
import { assertMediaConstraints } from "./assert-media-constraints";
import { assertMediaExists } from "./assert-media-exists";
import { validateCollection } from "./validate-collection";
import { validateItem } from "./validate-item";
import { validateTree } from "./validate-tree";

type CheckOptions = {
  /** Whether to check `config.json` is up to date. `qino build` turns it off outside CI, where it rewrites the file instead. */
  checkConfigFileFreshness?: boolean;
};

export async function check(
  { collections, items, trees, context }: Loaded,
  { checkConfigFileFreshness = true }: CheckOptions = {},
) {
  const primitives = [...collections, ...items, ...trees];
  // Without sharp, reads fall back to the image manifest, which `qino build`
  // writes from these reads: they must decode the files.
  if (primitives.some((primitive) => getImageFieldPaths(primitive).length)) {
    await loadSharp().catch((cause: unknown) => {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `Image fields are read with sharp, which can't load: ${reason}`,
        { cause },
      );
    });
  }

  await Promise.all([
    ...collections.map(validateCollection),
    ...items.map(validateItem),
    ...trees.map(validateTree),
  ]);

  consola.success("All content passes schema validation.");

  await assertMediaConstraints(primitives, context.mediaFolder);
  if (
    primitives.some(
      (p) =>
        Object.keys(p[QinoPrimitiveMarker].media).length ||
        p[QinoPrimitiveMarker].markdown.media.length,
    )
  ) {
    consola.success("All media files follow their media rules.");
  }

  if (context.cloud) {
    // Relation fields and titleField must be what's on disk for config.json.
    for (const primitive of primitives) {
      await assertInputValuesMatch(primitive);
    }

    if (checkConfigFileFreshness) {
      await assertConfigFileFresh({ context, collections, items, trees });
      consola.success("qino/_generated/config.json is up to date.");
    }
  }

  if (context.cli?.check?.localAssetReferences == false) {
    consola.info(
      "Media check skipped: `cli.check.localAssetReferences` is false.",
    );
  } else {
    await assertMediaExists(context);
    consola.success("All local media files exist.");
  }
}
