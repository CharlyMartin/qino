import { stat } from "node:fs/promises";

/** In bytes. */
export async function getFileSize(path: string) {
  return (await stat(path)).size;
}
