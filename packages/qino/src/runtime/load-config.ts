import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Config } from "./create-config";
import { LockFileSchema } from "../lib/lock-file";

let cached: Config | undefined;

export function getConfig() {
  if (cached) return cached;

  const lockPath = join(process.cwd(), "qino", "qino-lock.json");

  let raw: string;
  try {
    raw = readFileSync(lockPath, "utf8");
  } catch {
    throw new Error(
      `qino-lock.json not found at ${lockPath}. Run \`qino build\` before using collections.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`qino-lock.json at ${lockPath} is not valid JSON.`, {
      cause,
    });
  }

  const result = LockFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `qino-lock.json at ${lockPath} has an invalid shape. Run \`qino build\` to regenerate it.\n${z.prettifyError(result.error)}`,
    );
  }

  cached = result.data.config;
  return cached;
}

// export function __resetConfigCache() {
//   cached = undefined;
// }
