import {
  type AssertPageOptionsParams,
  assertPageOptions,
} from "./assert-page-options";

/**
 * Slices one 1-indexed page out of `items`. An empty list still has a page 1,
 * so a listing can render its empty state. A page past the last one throws.
 */
export function paginate<Item>(
  items: ReadonlyArray<Item>,
  params: AssertPageOptionsParams,
) {
  assertPageOptions(params);
  const { page, perPage, owner } = params;

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  if (page > pageCount) {
    throw new Error(
      `${owner}: page ${page} is out of range, expected 1 to ${pageCount}.`,
    );
  }

  const start = (page - 1) * perPage;
  return {
    entries: items.slice(start, start + perPage),
    page,
    perPage,
    pageCount,
    total,
  };
}
