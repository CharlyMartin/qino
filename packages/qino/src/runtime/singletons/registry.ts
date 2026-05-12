import { createRegistry } from "../../lib";
import type { AnySingleton } from "../../types";
import { QinoMeta } from "../../lib/globals";

export const singletonRegistry = createRegistry<AnySingleton>({
  key: "qino.registry.singletons",
  getKey: (singleton) => singleton[QinoMeta].file,
});
