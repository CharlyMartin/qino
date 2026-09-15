import { META_FIELD_NAME } from "../data/globals";
import type { AnyEntry, Slug, SupportedFileExtension } from "../types/utils";

type MakeDummyEntryOptions = {
  slug: Slug;
  extension: SupportedFileExtension;
  fields?: Record<string, unknown>;
};

export function makeDummyEntry({
  slug,
  extension,
  fields = {},
}: MakeDummyEntryOptions) {
  return {
    [META_FIELD_NAME]: {
      slug,
      fileName: `${slug}${extension}`,
      filePath: `/fixtures/${slug}${extension}`,
    },
    ...fields,
  } as AnyEntry;
}
