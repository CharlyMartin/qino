import { SUPPORTED_CONTENT_EXTENSIONS } from "../data";

export function extractExtension(file: string) {
  for (const ext of SUPPORTED_CONTENT_EXTENSIONS) {
    if (file.endsWith(ext)) return ext;
  }
  throw new Error(
    `extractExtension: file "${file}" must end with one of ${SUPPORTED_CONTENT_EXTENSIONS.join(", ")}.`,
  );
}
