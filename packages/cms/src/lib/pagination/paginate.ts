type PaginateOptions = {
  page: number;
  perPage: number;
  /** Prefixes error messages, e.g. `Collection "posts" (view "default")`. */
  owner: string;
};

/**
 * Slices one 1-indexed page out of `items`. An empty list still has a page 1,
 * so a listing can render its empty state. A page past the last one throws.
 */
export function paginate<Item>(
  items: ReadonlyArray<Item>,
  { page, perPage, owner }: PaginateOptions,
) {
  for (const [name, value] of Object.entries({ page, perPage })) {
    if (!Number.isInteger(value) || value < 1) {
      const received =
        typeof value == "string" ? JSON.stringify(value) : String(value);
      throw new Error(
        `${owner}: ${name} must be a positive integer, got ${received}.`,
      );
    }
  }

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
