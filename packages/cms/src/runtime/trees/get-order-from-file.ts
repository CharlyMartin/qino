import fs from "node:fs/promises";
import nodePath from "node:path";

import { isFile } from "../../lib/fs/is-file";
import type { SupportedFileExtension } from "../../types/utils";

type GetOrderFromFileParams = {
  folder: string;
  fileName: string;
  extension: SupportedFileExtension;
};

export type Order = {
  path: string;
  entries: string[];
};

export async function getOrderFromFile({
  folder,
  fileName,
  extension,
}: GetOrderFromFileParams) {
  const orderPath = nodePath.join(folder, fileName);
  if (!(await isFile(orderPath))) return;

  const raw = await fs.readFile(orderPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${orderPath} is not valid JSON.`, { cause: error });
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (entry) => typeof entry == "string" && entry.endsWith(extension),
    )
  ) {
    throw new Error(
      `${orderPath}: expected an array of filenames ending in "${extension}".\nEach filename must end with "${extension}".`,
    );
  }

  return { path: orderPath, entries: parsed } satisfies Order;
}
