import { initQino } from "@qino/cms";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

const schema = z.object({ markdown: z.string(), title: z.string() });
const qino = initQino({ contentFolder: "content", mediaFolder: "public" });

// Derive helpers from the public API so source and dist checks use the same symbols.
type CollectionView = Parameters<
  NonNullable<
    Parameters<typeof qino.defineCollection<typeof schema, ".md">>[0]["views"]
  >
>[0];
type TreeView = Parameters<
  NonNullable<
    Parameters<
      typeof qino.defineTree<typeof schema, ".md", "title">
    >[0]["views"]
  >
>[0];
type ItemView = Parameters<
  NonNullable<
    Parameters<typeof qino.defineItem<typeof schema, "/home.json">>[0]["views"]
  >
>[0];

function withReadingTime(view: CollectionView) {
  return view({
    augment: (entry) => ({
      readingMinutes: Math.ceil(entry.markdown.split(/\s+/u).length / 220),
    }),
    filter: (entry) => entry.readingMinutes > 0,
    sort: (a, b) => a.readingMinutes - b.readingMinutes,
  });
}

function treePreview(view: TreeView) {
  expectTypeOf<keyof Parameters<typeof view>[0]>().toEqualTypeOf<
    "resolveRelations" | "augment"
  >();
  return view({ augment: (entry) => ({ source: entry._meta.slug }) });
}

function itemPreview(view: ItemView) {
  expectTypeOf<keyof Parameters<typeof view>[0]>().toEqualTypeOf<
    "resolveRelations" | "augment"
  >();
  return view({ augment: (entry) => ({ source: entry._meta.filePath }) });
}

test("public factory types support reusable views with inferred getter results", async () => {
  const posts = qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema,
    views: (view) => ({ default: view({}), reading: withReadingTime(view) }),
  });
  const tree = qino.defineTree({
    directory: "/docs",
    extension: ".md",
    titleField: "title",
    schema,
    views: (view) => ({ default: view({}), preview: treePreview(view) }),
  });
  const home = qino.defineItem({
    file: "/home.json",
    schema,
    views: (view) => ({ default: view({}), preview: itemPreview(view) }),
  });
  const omitted = {
    filter: undefined,
    sort: undefined,
    resolveRelations: undefined,
  };
  expectTypeOf(await posts.getMany({ view: "reading", ...omitted }))
    .items.toHaveProperty("readingMinutes")
    .toEqualTypeOf<number>();
  expectTypeOf(
    (await tree.getEntry("hello", { view: "preview" })).source,
  ).toEqualTypeOf<string>();
  expectTypeOf(
    (await home.getData({ view: "preview" })).source,
  ).toEqualTypeOf<`${string}.json`>();
});
