import { SUPPORTED_EXTENSIONS } from "../../lib/globals";

export function extractExtension(file: string) {
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (file.endsWith(ext)) return ext;
  }
  throw new Error(
    `extractExtension: file "${file}" must end with one of ${SUPPORTED_EXTENSIONS.join(", ")}.`,
  );
}
