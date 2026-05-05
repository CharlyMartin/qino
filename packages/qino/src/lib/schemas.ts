import { z } from "zod";
import type { SupportedFileExtention } from "../types";

export function FilePath<E extends SupportedFileExtention>(extension: E) {
  return z
    .string()
    .endsWith(extension)
    .transform((val) => val as `${string}${E}`);
}
