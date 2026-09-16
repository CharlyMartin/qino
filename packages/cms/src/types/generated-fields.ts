import type { META_FIELD_NAME } from "../data/globals";
import type { SupportedFileExtension } from "./utils";

export type MarkdownExtension = Exclude<SupportedFileExtension, ".json">;

export type GeneratedFields<Meta> = {
  [K in typeof META_FIELD_NAME]: Meta;
};
