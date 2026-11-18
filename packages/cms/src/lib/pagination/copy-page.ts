import type { PaginatedEntries } from "../../types/collection";

/**
 * Copies each entry's top-level fields, so a page sliced from a listing that
 * other calls share can be changed without reaching them.
 */
export function copyPage<Entry extends object>(page: PaginatedEntries<Entry>) {
  const entries = page.entries.map((entry) => ({ ...entry }));
  return { ...page, entries };
}
