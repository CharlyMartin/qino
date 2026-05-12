import { createRegistry, QinoMeta } from "../../lib";
import type { AnyCollection } from "../../types";

export const collectionRegistry = createRegistry<AnyCollection>({
  key: "qino.registry.collections",
  getKey: (collection) => collection[QinoMeta].directory,
});
