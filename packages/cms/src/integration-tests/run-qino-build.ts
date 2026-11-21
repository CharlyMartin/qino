import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const jitiCli = path.join(packageRoot, "node_modules/jiti/lib/jiti-cli.mjs");
const cli = path.join(packageRoot, "src/cli/index.ts");

/**
 * Runs `qino build` from source in `cwd`, outside CI unless `ci` sets `CI`.
 * Rejects with the CLI's output when it fails.
 */
export function runQinoBuild(cwd: string, ci?: string) {
  const { CI: _, ...env } = process.env;

  return exec(process.execPath, [jitiCli, cli, "build"], {
    cwd,
    env: { ...env, ...(ci == null ? {} : { CI: ci }), CONSOLA_LEVEL: "3" },
  });
}
