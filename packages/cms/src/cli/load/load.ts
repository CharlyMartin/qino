import { QinoConfigMarker } from "../../data/globals";
import { createLoader } from "./create-loader";
import { getEntryFilePath } from "./get-entry-file-path";
import { getRootDirPath } from "./get-root-dir-path";
import { loadQinoConfig } from "./load-qino-config";
import { loadQinoPrimitives } from "./load-qino-primitives";

export type Loaded = Awaited<ReturnType<typeof load>>;

export async function load() {
  const rootDirPath = await getRootDirPath();
  const entryFilePath = getEntryFilePath(rootDirPath);
  const jiti = await createLoader();

  const { collections, items, trees } = await loadQinoPrimitives(
    rootDirPath,
    jiti,
  );

  const config = await loadQinoConfig(entryFilePath, jiti);

  return {
    entryFilePath,
    context: config[QinoConfigMarker],
    collections,
    items,
    trees,
  };
}
