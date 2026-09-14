import { createQino } from "qino";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import type { CollectionEntryMeta } from "./collection";
import type { CollectionViewFactory } from "./collection-views";
import type { SingletonEntryMeta } from "./singleton";
import type { TreeEntryMeta } from "./tree";
import type { ViewFactory } from "./views";

const schema = z.object({ title: z.string(), body: z.string() });
const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

function withReadingTime(
  view: CollectionViewFactory<
    typeof schema,
    CollectionEntryMeta<".md">,
    object
  >,
) {
  return view({
    augment: (entry) => ({
      readingMinutes: Math.ceil(entry.body.split(/\s+/u).length / 220),
    }),
    filter: (entry) => entry.readingMinutes > 0,
    sort: (a, b) => a.readingMinutes - b.readingMinutes,
  });
}

function treePreview(
  view: ViewFactory<typeof schema, TreeEntryMeta<".md">, object>,
) {
  expectTypeOf<keyof Parameters<typeof view>[0]>().toEqualTypeOf<
    "resolveRelations" | "augment"
  >();
  return view({ augment: (entry) => ({ source: entry._meta.slug }) });
}

function singletonPreview(
  view: ViewFactory<typeof schema, SingletonEntryMeta<".json">, object>,
) {
  expectTypeOf<keyof Parameters<typeof view>[0]>().toEqualTypeOf<
    "resolveRelations" | "augment"
  >();
  return view({ augment: (entry) => ({ source: entry._meta.filePath }) });
}

test("public factory types support reusable views with inferred getter results", async () => {
  const posts = qino.createCollection({
    directory: "/posts",
    extension: ".md",
    schema,
    views: (view) => ({ default: view({}), reading: withReadingTime(view) }),
  });
  const tree = qino.createTree({
    directory: "/docs",
    extension: ".md",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}), preview: treePreview(view) }),
  });
  const home = qino.createSingleton({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}), preview: singletonPreview(view) }),
  });
  const omitted = {
    filter: undefined,
    sort: undefined,
    resolveRelations: undefined,
  };
  expectTypeOf(
    (await posts.getAll({ view: "reading", ...omitted }))[0].readingMinutes,
  ).toEqualTypeOf<number>();
  expectTypeOf(
    (await tree.getEntry("hello", { view: "preview" })).source,
  ).toEqualTypeOf<string>();
  expectTypeOf(
    (await home.getData({ view: "preview" })).source,
  ).toEqualTypeOf<`${string}.json`>();
});
