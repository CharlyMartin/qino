import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Writes a project for the `qino` CLI: `files` by path, plus an empty
 * `public` media folder and a `package.json`, linked to this package and its
 * zod.
 */
export async function createCliProject(
  cwd: string,
  files: Record<string, string>,
) {
  for (const directory of ["public", "node_modules/@qino"]) {
    await fs.mkdir(path.join(cwd, directory), { recursive: true });
  }
  await fs.symlink(
    packageRoot,
    path.join(cwd, "node_modules/@qino/cms"),
    "junction",
  );
  await fs.symlink(
    path.join(packageRoot, "node_modules/zod"),
    path.join(cwd, "node_modules/zod"),
    "junction",
  );

  const project = {
    "package.json": JSON.stringify({ private: true, type: "module" }),
    ...files,
  };
  for (const [file, content] of Object.entries(project)) {
    await fs.mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await fs.writeFile(path.join(cwd, file), content);
  }
}
