import { z } from "zod";
import type { SupportedFileExtension } from "../types";

export function FilePath<E extends SupportedFileExtension>(extension: E) {
  return z
    .string()
    .endsWith(extension)
    .transform((val) => val as `${string}${E}`);
}
