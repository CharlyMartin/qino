import { isDirectory } from "./is-directory";

export async function assertDirectory(path: string, message?: string) {
  const isValidDirectory = await isDirectory(path);

  if (!isValidDirectory) {
    throw new Error(message || `"${path}" is not a directory`);
  }
}
