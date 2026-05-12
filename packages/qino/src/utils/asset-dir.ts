import { stat } from "fs/promises";

export async function assertDir(path: string, message?: string) {
  let isDir = false;
  try {
    isDir = (await stat(path)).isDirectory();
  } catch {}
  if (!isDir) throw new Error(message || `${path} is not a directory`);
}
