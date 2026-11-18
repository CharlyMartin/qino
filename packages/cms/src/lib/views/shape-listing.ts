import type { CollectionCallbacks } from "../../types/collection-views";
import type { AnyEntry, Slug } from "../../types/utils";
import { getEntrySlug } from "../meta/get-entry-slug";

type ShapeListingParams = {
  /** Augmented entries, in slug order. */
  entries: Array<AnyEntry>;
  view: CollectionCallbacks<never>;
  /** Every slug, in order, for the ties. */
  slugs: Array<Slug>;
  /** The previous listing's order, to start the sort from. */
  lastOrder?: Array<Slug>;
};

/**
 * Runs a view's `filter`, in slug order, then its `sort`. Ties keep slug
 * order whatever the input order, so a sort started from the last listing,
 * which is almost sorted already, returns what a fresh one would.
 */
export function shapeListing({
  entries,
  view: { filter, sort },
  slugs,
  lastOrder = [],
}: ShapeListingParams) {
  const kept = filter
    ? entries.filter((entry) => filter(entry as never))
    : entries;
  if (!sort) return kept;
  // A stable sort of slug order already keeps ties in slug order.
  if (lastOrder.length == 0) {
    return kept.toSorted((a, b) => sort(a as never, b as never));
  }

  const rank = new Map(slugs.map((slug, index) => [slug, index]));
  const rankOf = (entry: AnyEntry) => rank.get(getEntrySlug(entry)) ?? 0;
  const compare = (a: AnyEntry, b: AnyEntry) =>
    sort(a as never, b as never) || rankOf(a) - rankOf(b);

  // The last order first, then new entries in slug order.
  const bySlug = new Map(kept.map((entry) => [getEntrySlug(entry), entry]));
  const seeded: Array<AnyEntry> = [];
  for (const slug of lastOrder) {
    const entry = bySlug.get(slug);
    if (!entry) continue;
    seeded.push(entry);
    bySlug.delete(slug);
  }
  for (const entry of bySlug.values()) seeded.push(entry);

  return seeded.toSorted(compare);
}
