import { META_FIELD_NAME } from "../../data/globals";
import type { CollectionEntryMeta } from "../../types/collection";
import type { AnyEntry } from "../../types/utils";

export function getEntrySlug(entry: AnyEntry) {
  return (entry[META_FIELD_NAME] as CollectionEntryMeta).slug;
}
