import { join } from "node:path";

import { ROOT_FOLDER_NAME } from "../../data/globals";
import { assertDirectory } from "../../utils/assert-directory";

export async function getRootDirPath() {
  const cwd = process.cwd();

  const rootDirPath = join(cwd, ROOT_FOLDER_NAME);
  await assertDirectory(
    rootDirPath,
    `"${ROOT_FOLDER_NAME}" folder not found at "${rootDirPath}"`,
  );

  return rootDirPath;
}
