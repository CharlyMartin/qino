import { consola } from "consola";

import type { Loaded } from "../load/load";
import { assertConfigFileFresh } from "./assert-config-file-fresh";
import { assertInputValuesMatch } from "./assert-input-values-match";
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

  if (context.buildConfigFile) {
    // Relation fields and titleField must be what's on disk for config.json.
    for (const primitive of [...collections, ...items, ...trees]) {
      await assertInputValuesMatch(primitive);
    }

    if (checkConfigFileFreshness) {
      await assertConfigFileFresh({ context, collections, items, trees });
      consola.success("qino/_generated/config.json is up to date.");
    }
  }

  if (context.checkLocalAssetReferences == false) {
    consola.info("Media check skipped: `checkLocalAssetReferences` is false.");
  } else {
    await assertMediaExists(context);
    consola.success("All local media files exist.");
  }
}
