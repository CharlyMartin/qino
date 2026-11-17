export type AssertPageOptionsParams = {
  page: number;
  perPage: number;
  /** Prefixes error messages, e.g. `Collection "posts" (view "default")`. */
  owner: string;
};

/** Throws unless `page` and `perPage` are positive integers. */
export function assertPageOptions({
  page,
  perPage,
  owner,
}: AssertPageOptionsParams) {
  for (const [name, value] of Object.entries({ page, perPage })) {
    if (!Number.isInteger(value) || value < 1) {
      const received =
        typeof value == "string" ? JSON.stringify(value) : String(value);
      throw new Error(
        `${owner}: ${name} must be a positive integer, got ${received}.`,
      );
    }
  }
}
