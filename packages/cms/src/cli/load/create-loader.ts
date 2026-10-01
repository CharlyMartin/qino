import { createJiti } from "jiti";

import { findTsconfigPath } from "./find-tsconfig-path";

export async function createLoader() {
  return createJiti(import.meta.url, {
    tsconfigPaths: (await findTsconfigPath(process.cwd())) ?? false,
  });
}
