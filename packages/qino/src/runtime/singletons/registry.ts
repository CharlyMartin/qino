import { createRegistry, QinoMeta } from "../../lib";
import type { AnySingleton } from "../../types";

export const singletonRegistry = createRegistry<AnySingleton>({
  key: "qino.registry.singletons",
  getKey: (singleton) => singleton[QinoMeta].file,
});
