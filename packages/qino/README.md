# qino

Flat-file Markdown CMS. Requires Node.js 22 or newer. See [`SPECS.md`](../../SPECS.md) for the design intent.

## Path validation

Run `qino lint` or `qino build` to detect duplicate or overlapping collection,
tree, and singleton paths. Importing definitions does not check path conflicts,
so hot reload can recreate definitions on the same Qino instance without stale
registrations. Include either command in your build or CI workflow to enforce
path ownership.

## Views

Collections, trees, and singletons can expose different shapes of the same content:

```ts
const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

const authors = qino.createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});

const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string(), author: z.string() }),
  relations: { author: () => authors },
  views: (view) => ({
    listing: view({}),
    detail: view({
      resolveRelations: true,
      augment: (post) => ({ authorName: post.author.name }),
    }),
  }),
});

const listing = await posts.getAll({ view: "listing" }); // author is a path string
const detail = await posts.getOne("hello", { view: "detail" }); // author resolves; authorName exists
const defaults = await posts.getAll(); // top-level configuration
```

Import `createQino` from `qino` and `z` from `zod`. Authored relations use
content paths, such as `authors/alice.json`.

View names autocomplete. Each view independently defaults to
`resolveRelations: false` and no augment. Augment may be async and runs after
the selected view’s relation resolution. Without explicit resolution, both
getters and augment callbacks receive raw references. Embedded relation targets never include
their own augment fields.

Top-level `resolveRelations` and `augment` define the implicit default.
Omit `view` to select it; `"default"` is reserved and cannot be configured or
passed to a getter. Unknown names fail in TypeScript and at runtime.

Breaking change: getters no longer accept `resolveRelations`. Move each
override into a named view and select it with `{ view: "name" }`. Flat/default
augment callbacks now receive resolved relations when resolution is enabled.
Resolution now defaults to `false` for the implicit default and all named views.
If existing code requires expanded relations, add `resolveRelations: true` or a
numeric depth to that configuration.

### Required view helpers

All three primitives require the same helper syntax for custom views:

```ts
// Before (no longer supported)
views: {
  detail: { resolveRelations: 1 },
}

// After
views: (view) => ({
  detail: view({ resolveRelations: 1 }),
  empty: view({}),
})
```

This is a breaking syntax change. `views` is optional; root settings still define
the implicit default view. When supplied, the factory must synchronously return
named views, each created by the helper. It runs once during primitive creation.
Legacy object-form views and unwrapped definitions fail in TypeScript and at runtime.

The supplied helper exposes only the options supported by its primitive:

| Option             | Collection | Tree | Singleton |
| ------------------ | ---------- | ---- | --------- |
| `resolveRelations` | Yes        | Yes  | Yes       |
| `augment`          | Yes        | Yes  | Yes       |
| `filter`           | Yes        | No   | No        |
| `sort`             | Yes        | No   | No        |

Tree and singleton helpers omit filter and sort from autocomplete and reject them
in TypeScript and at runtime. Tree sorting still uses `_order.json`; tree filtering
remains future work. Each helper infers its primitive's schema, metadata, resolved
relations, and augmented fields. Views inherit no root or sibling settings.

### Reusable views

Import the factory type and entry metadata type from `qino` to annotate a shared
helper. The returned view and its augmented fields remain inferred:

```ts
import {
  createQino,
  type CollectionEntryMeta,
  type CollectionViewFactory,
} from "qino";
import { markdown } from "qino/utils";
import { z } from "zod";

const PostSchema = z.object({ title: z.string(), body: z.string() });

function withReadingTime(
  view: CollectionViewFactory<
    typeof PostSchema,
    CollectionEntryMeta<".md">,
    object
  >,
) {
  return view({
    augment: (post) => ({
      readingMinutes: Math.ceil(markdown.stats(post.body).wordCount / 220),
    }),
    sort: (a, b) => a.readingMinutes - b.readingMinutes,
  });
}

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema: PostSchema,
  views: (view) => ({ reading: withReadingTime(view) }),
});

const entries = await posts.getAll({ view: "reading" });
// entries[number].readingMinutes is inferred as number.
```

Use `ViewFactory` with `TreeEntryMeta` or `SingletonEntryMeta` for trees and
singletons; those factories offer only resolution and augmentation. The third
factory type parameter describes the relation map: use `object` when there are
no relations, or `typeof relations` for a declared map. The internal view marker
is not part of the public API.

Explicit `undefined` in getter options is treated as omission, including when
options are spread. Actual per-call resolution, filter, and sort overrides still
throw. Runtime checks likewise ignore undefined filter/sort values in tree and
singleton definitions while rejecting any supplied value, including `null`.

## Collection filtering and sorting

Configure synchronous `filter(entry): boolean` and `sort(a, b): number` callbacks
when creating a collection. Filtering runs after relation resolution and
augmentation for both `getAll()` and `getOne()`. Sorting follows filtering for
`getAll()` only.

```ts
const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), draft: z.boolean() }),
  augment: (entry) => ({ titleLength: entry.title.length }),
  filter: (entry) => !entry.draft,
  sort: (a, b) => a.titleLength - b.titleLength,
  views: (view) => ({
    alphabetical: view({
      augment: (entry) => ({ label: entry.title.toLowerCase() }),
      filter: (entry) => !entry.draft && entry.label.length > 0,
      sort: (a, b) => a.label.localeCompare(b.label),
    }),
    all: view({}),
  }),
});

await posts.getAll(); // Default filter and sort.
await posts.getAll({ view: "alphabetical" }); // Independent view callbacks.
await posts.getAll({ view: "all" }); // Every entry, in discovery order.
```

The `view` helper preserves inference for augmented fields and resolved relations
without annotations. The factory runs once at collection creation. Every custom
view must use the helper, including views that only resolve or augment entries. Custom views are independent
and inherit neither top-level callbacks nor augmentation.

Filtering retains matching entries; sorting uses native `toSorted` comparator
semantics, preserving relative order for ties. Without callbacks, all entries
remain in discovery order. Callback errors reject the read.

`getOne(slug, { view })` throws if the selected view’s filter excludes the entry.
The error names the slug, collection, and view. Omitting `view` uses the default
filter; an independent view without a filter can read every entry.
Slug discovery, CLI validation, and relation loading bypass both callbacks. Getters accept view selection, not
filter or sort overrides. Trees keep `_order.json` ordering; tree filtering is
future work. Singletons have neither callback.

## Relations

Collections, trees, and singletons can each reference any of the three types:

| Source → Target | Collection | Tree | Singleton |
| --------------- | ---------- | ---- | --------- |
| Collection      | Yes        | Yes  | Yes       |
| Tree            | Yes        | Yes  | Yes       |
| Singleton       | Yes        | Yes  | Yes       |

Declare a target directly or with a lazy function for forward references:

```ts
const docs = qino.createTree({
  directory: "/docs",
  extension: ".md",
  titleField: "title",
  schema: z.object({ title: z.string(), body: z.string() }),
});

const home = qino.createSingleton({
  file: "/home.json",
  schema: z.object({
    featuredDoc: z.string(),
    relatedDocs: z.array(z.string()),
  }),
  relations: { featuredDoc: docs, "relatedDocs[*]": () => docs },
  resolveRelations: 1,
});
```

In `home.json`, store references such as `"featuredDoc": "docs/guides/setup.md"`.
A tree target resolves to that file's content and `_meta` (including the nested
slug `guides/setup`), without children or navigation data. The directory and
extension must match the target; a leading `/` is optional. Singleton references
must match the singleton's configured file.

Relations resolve only when enabled on the source's default or named view.
Numeric depths allow 1–6 relation hops; `true` means 6. Embedded targets bypass
their own views and augment callbacks. All related primitives must belong to the
same `createQino()` instance. Relations are directional; reverse links are not
created automatically.

## Collection slugs

```ts
const slugs = await posts.getAllSlugs(); // ["hello", "second-post"]
```

`getAllSlugs()` discovers filenames in the collection's flat directory, strips
the configured trailing extension, and sorts the slugs using `.sort()`. It returns
`Promise<Array<SlugFor<Dir>>>`, using generated slug types when available.
It takes no options and does not read content, validate schemas, resolve relations,
or run augment, filter, or sort callbacks. Invalid content still has a slug. Empty or missing
directories return `[]`; hidden files and nested files are excluded.

Use `getAll()` / `getOne()` to read and validate content and apply views.
CLI validation uses the internal `readAll()` source reader without running views;
collection slug generation uses `getAllSlugs()` for filename discovery.
