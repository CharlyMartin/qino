import fs from "node:fs/promises";
import nodePath from "node:path";

import { z } from "zod";

import type { SupportedFileExtension } from "../../types";
import { isFile } from "../../utils";

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
  } catch (cause) {
    throw new Error(`${orderPath} is not valid JSON.`, { cause });
  }

  const schema = z.array(
    z.string().refine((s) => s.endsWith(extension), {
      error: `must end with "${extension}"`,
    }),
  );

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `${orderPath}: expected an array of filenames ending in "${extension}".\n${z.prettifyError(result.error)}`,
    );
  }

  return { path: orderPath, entries: result.data } satisfies Order;
}
