import { stat } from "fs/promises";

export async function assertFile(path: string, message?: string) {
  let isFile = false;
  try {
    isFile = (await stat(path)).isFile();
  } catch {}
  if (!isFile) throw new Error(message || `${path} is not a file`);
}
