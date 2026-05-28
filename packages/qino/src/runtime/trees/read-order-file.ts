import fs from "node:fs/promises";
import nodePath from "node:path";

import { z } from "zod";

import { isFile } from "../../utils";

const OrderFileSchema = z.array(z.string());

type ReadOrderFileParams = {
  folder: string;
  fileName: string;
};

// Should the order files include the file extensions? I think so. To be reworked.
export async function readOrderFile({ folder, fileName }: ReadOrderFileParams) {
  const orderPath = nodePath.join(folder, fileName);
  if (!(await isFile(orderPath))) return null;

  const raw = await fs.readFile(orderPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`${orderPath} is not valid JSON.`, { cause });
  }

  const result = OrderFileSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `${orderPath}: expected an array of strings (bare slugs, no extension).\n${z.prettifyError(result.error)}`,
    );
  }

  return { path: orderPath, entries: result.data };
}
