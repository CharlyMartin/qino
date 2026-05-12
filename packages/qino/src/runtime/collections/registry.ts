import { createRegistry } from "../../lib";
import type { AnyCollection } from "../../types";
import { QinoMeta } from "../../lib/globals";

export const collectionRegistry = createRegistry<AnyCollection>({
  key: "qino.registry.collections",
  getKey: (collection) => collection[QinoMeta].directory,
});
