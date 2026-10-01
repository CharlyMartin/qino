import { dirname, join, resolve } from "node:path";

import { isFile } from "../../lib/fs/is-file";

export async function findTsconfigPath(cwd: string) {
  let directory = resolve(cwd);

  while (true) {
    const tsconfigPath = join(directory, "tsconfig.json");
    if (await isFile(tsconfigPath)) return tsconfigPath;

    const parent = dirname(directory);
    if (parent == directory) return undefined;
    directory = parent;
  }
}
