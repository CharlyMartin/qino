import type { AnyEntry, SupportedFileExtension } from "../../types";

type MakeDummyEntryOptions = {
  slug: string;
  extension: SupportedFileExtension;
  fields?: Record<string, unknown>;
};

export function makeDummyEntry({
  slug,
  extension,
  fields = {},
}: MakeDummyEntryOptions) {
  return {
    _meta: {
      slug,
      fileName: `${slug}${extension}`,
      filePath: `/fixtures/${slug}${extension}`,
    },
    ...fields,
  } as AnyEntry;
}
