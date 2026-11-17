import type { PaginatedEntries } from "@qino/cms";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { AnyCollection } from "./collection";

type RawPageOptions = { view?: "raw"; perPage: number };

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const authors = qino.defineCollection({
  directory: "authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});
const posts = qino.defineCollection({
  directory: "posts",
  extension: ".md",
  schema: z.object({ title: z.string(), author: z.string() }),
  relations: { author: authors },
  views: (view) => ({
    default: view({ augment: (post) => ({ label: post.author.name }) }),
    raw: view({
      resolveDepth: { author: 0 },
      sort: (a, b) => a.title.localeCompare(b.title),
    }),
  }),
});

test("returns the selected view's entries with page totals", async () => {
  const page = await posts.getPaginatedEntries(1, { perPage: 10 });
  expectTypeOf(page.entries)
    .items.toHaveProperty("label")
    .toEqualTypeOf<string>();
  expectTypeOf(page).toExtend<PaginatedEntries<unknown>>();
  expectTypeOf(page.pageCount).toEqualTypeOf<number>();
  expectTypeOf(page.total).toEqualTypeOf<number>();

  const raw = await posts.getPaginatedEntries(2, { view: "raw", perPage: 10 });
  expectTypeOf(raw.entries)
    .items.toHaveProperty("author")
    .toEqualTypeOf<string>();
  // @ts-expect-error The raw view has no default augment.
  raw.entries[0]?.label;
});

test("an optional view selection can return the default view", async () => {
  const options: RawPageOptions = { perPage: 10 };
  const page = await posts.getPaginatedEntries(1, options);
  // @ts-expect-error The default view resolves author to an object.
  page.entries[0]?.author.toUpperCase();
});

test("requires perPage and rejects unknown views and getter callbacks", () => {
  // @ts-expect-error perPage is required.
  posts.getPaginatedEntries(1, {});
  // @ts-expect-error Options are required.
  posts.getPaginatedEntries(1);
  // @ts-expect-error Unknown views fail.
  posts.getPaginatedEntries(1, { view: "missing", perPage: 10 });
  // @ts-expect-error Callbacks can only be configured at creation.
  posts.getPaginatedEntries(1, { perPage: 10, sort: () => 0 });
  // @ts-expect-error Callbacks can only be configured at creation.
  posts.getPaginatedEntries(1, { perPage: 10, filter: () => true });
  // @ts-expect-error Depths can only be configured in a view.
  posts.getPaginatedEntries(1, { perPage: 10, resolveDepth: { author: 0 } });
  // @ts-expect-error The page is a number, not a route param string.
  posts.getPaginatedEntries("2", { perPage: 10 });
});

test("typed collections still compare to AnyCollection", () => {
  expectTypeOf(posts).toExtend<AnyCollection>();
});
