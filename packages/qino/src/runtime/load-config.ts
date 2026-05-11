import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { Config } from "./config";
import { LockFileSchema } from "../lib/lock-file";

let cached: Promise<Config> | undefined;

const FOLDER_NAME = "qino";
const LOCK_FILE_NAME = "qino-lock.json";

export function getConfig() {
  if (!cached) {
    cached = load().catch((err) => {
      cached = undefined;
      throw err;
    });
  }
  return cached;
}

async function load(): Promise<Config> {
  const lockPath = join(process.cwd(), FOLDER_NAME, LOCK_FILE_NAME);

  let raw: string;
  try {
    raw = await readFile(lockPath, "utf8");
  } catch {
    throw new Error(
      `${LOCK_FILE_NAME} not found at ${lockPath}. Run \`qino build\` before using collections.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`${LOCK_FILE_NAME} at ${lockPath} is not valid JSON.`, {
      cause,
    });
  }

  const result = LockFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `${LOCK_FILE_NAME} at ${lockPath} has an invalid shape. Run \`qino build\` to regenerate it.\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data.config;
}
