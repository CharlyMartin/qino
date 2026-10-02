import type {
  MARKDOWN_FIELD_NAME,
  META_FIELD_NAME,
  RAW_FIELD_NAME,
} from "../data/globals";
import type { SupportedFileExtension } from "./utils";

export type MarkdownExtension = Exclude<SupportedFileExtension, ".json">;

export type MarkdownFields = {
  [K in typeof MARKDOWN_FIELD_NAME | typeof RAW_FIELD_NAME]: string;
};

export type IsMarkdownMeta<Meta> = Meta extends {
  filePath: infer File extends string;
}
  ? Extract<File, `${string}${MarkdownExtension}`> extends never
    ? false
    : true
  : false;

export type GeneratedFields<Meta> = {
  [K in typeof META_FIELD_NAME]: Meta;
} & (IsMarkdownMeta<Meta> extends true ? MarkdownFields : unknown);
