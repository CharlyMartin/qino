import { describe, expect, test, vi } from "vitest";

import { makeDummyEntry } from "../../test-utils/make-dummy-entry";
import type { AnyEntry } from "../../types/utils";
import { getEntrySlug } from "../meta/get-entry-slug";
import { shapeListing } from "./shape-listing";

function makeEntries(ranks: Record<string, number>) {
  return Object.entries(ranks).map(([slug, rank]) =>
    makeDummyEntry({ slug, extension: ".json", fields: { rank } }),
  );
}

const byRank = (a: AnyEntry, b: AnyEntry) =>
  (a.rank as number) - (b.rank as number);
const slugsOf = (entries: Array<AnyEntry>) => entries.map(getEntrySlug);

describe("shapeListing", () => {
  test("filters in slug order and keeps slug order without a sort", () => {
    const entries = makeEntries({ a: 1, b: 2, c: 3 });
    const filter = vi.fn((entry: AnyEntry) => entry.rank != 2);

    const shaped = shapeListing({
      entries,
      view: { filter: filter as never },
      slugs: ["a", "b", "c"],
    });

    expect(slugsOf(shaped)).toEqual(["a", "c"]);
    expect(slugsOf(filter.mock.calls.map(([entry]) => entry))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("sorts, with ties in slug order", () => {
    const shaped = shapeListing({
      entries: makeEntries({ a: 2, b: 1, c: 2, d: 1 }),
      view: { sort: byRank as never },
      slugs: ["a", "b", "c", "d"],
    });

    expect(slugsOf(shaped)).toEqual(["b", "d", "a", "c"]);
  });

  test("returns what a fresh sort would, whatever the last order", () => {
    const entries = makeEntries({ a: 2, b: 1, c: 2, d: 1, e: 0 });
    const slugs = ["a", "b", "c", "d", "e"];
    const fresh = shapeListing({
      entries,
      view: { sort: byRank as never },
      slugs,
    });

    for (const lastOrder of [
      ["c", "a", "d", "b"],
      ["d", "c", "b", "a", "e"],
      ["gone", "a"],
    ]) {
      const seeded = shapeListing({
        entries,
        view: { sort: byRank as never },
        slugs,
        lastOrder,
      });
      expect(slugsOf(seeded)).toEqual(slugsOf(fresh));
    }
  });

  test("sorts a listing too large to spread into one call", () => {
    const slugs = Array.from({ length: 200_000 }, (_, index) =>
      String(index).padStart(6, "0"),
    );
    const entries = slugs.map((slug, index) =>
      makeDummyEntry({ slug, extension: ".json", fields: { rank: -index } }),
    );

    for (const lastOrder of [[], slugs.slice(0, 10)]) {
      const shaped = shapeListing({
        entries,
        view: { sort: byRank as never },
        slugs,
        lastOrder,
      });
      expect(shaped).toHaveLength(200_000);
      expect(slugsOf([shaped[0] as AnyEntry])).toEqual(["199999"]);
    }
  });
});
