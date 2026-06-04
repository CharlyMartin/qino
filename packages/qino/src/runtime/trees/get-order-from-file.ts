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

  const schema = z.array(
    z.string().refine((s) => s.endsWith(extension), {
      error: `must end with "${extension}"`,
    }),
  );

  try {
    const parsed = JSON.parse(raw);
    const zodParsed = schema.parse(parsed);
    return { path: orderPath, entries: zodParsed } satisfies Order;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `${orderPath}: expected an array of filenames ending in "${extension}".\n${error.message}`,
      );
    }

    throw new Error(`${orderPath} is not valid JSON.`, { cause: error });
  }
}
