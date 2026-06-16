import fs from "node:fs/promises";
import nodePath from "node:path";

/**
 * Writes the generated types only when the content changed, keeping
 * `qino build` idempotent (no diff on unchanged inputs). Returns whether a
 * write happened.
 */

export async function writeGeneratedTypes(filePath: string, content: string) {
  const existing = await fs.readFile(filePath, "utf-8").catch(() => null);
  if (existing == content) return false;

  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  return true;
}
