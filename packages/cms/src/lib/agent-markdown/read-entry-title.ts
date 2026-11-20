import { toOneLine } from "./to-one-line";

export type ReadEntryTitleParams = {
  entry: Record<string, unknown>;
  /** The field holding the title. Defaults to `"title"`. */
  titleField?: string;
  /** The title when the entry has none, such as its slug. */
  fallbackTitle: string;
};

/** An entry's title, collapsed onto one line, or `fallbackTitle` when it's blank. */
export function readEntryTitle({
  entry,
  titleField = "title",
  fallbackTitle,
}: ReadEntryTitleParams) {
  const title = entry[titleField];
  return (typeof title == "string" && toOneLine(title)) || fallbackTitle;
}
