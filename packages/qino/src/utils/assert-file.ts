import { isFile } from "./is-file";

export async function assertFile(path: string, message?: string) {
  const isValidFile = await isFile(path);

  if (!isValidFile) {
    throw new Error(message || `"${path}" is not a file`);
  }
}
