import { consola } from "consola";

import { QinoPrimitiveMarker } from "../../data/globals";
import type { Loaded } from "../load/load";
import { assertConfigFileFresh } from "./assert-config-file-fresh";
import { assertInputValuesMatch } from "./assert-input-values-match";
import { assertMediaConstraints } from "./assert-media-constraints";
import { assertMediaExists } from "./assert-media-exists";
import { validateCollection } from "./validate-collection";
import { validateItem } from "./validate-item";
import { validateTree } from "./validate-tree";

type CheckOptions = {
  /** Whether to check `config.json` is up to date. `qino build` turns it off, since it rewrites the file. */
  checkConfigFileFreshness?: boolean;
};

export async function check(
  { collections, items, trees, context }: Loaded,
  { checkConfigFileFreshness = true }: CheckOptions = {},
) {
  await Promise.all([
    ...collections.map(validateCollection),
    ...items.map(validateItem),
    ...trees.map(validateTree),
  ]);

  consola.success("All content passes schema validation.");

  const primitives = [...collections, ...items, ...trees];
  await assertMediaConstraints(primitives, context.mediaFolder);
  if (
    primitives.some((p) => Object.keys(p[QinoPrimitiveMarker].media).length)
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
