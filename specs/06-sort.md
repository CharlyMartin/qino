# Collection filtering and sorting

**Status:** stable
**Version:** v1

## API

Collections accept optional synchronous `filter(entry): boolean` and
`sort(a, b): number` callbacks inside default or custom views; root callbacks are forbidden. Getters do not accept callback overrides.

```ts
const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), draft: z.boolean() }),
  views: (view) => ({
    default: view({
      augment: (entry) => ({ titleLength: entry.title.length }),
      filter: (entry) => !entry.draft,
      sort: (a, b) => a.titleLength - b.titleLength,
    }),
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

Here `qino` is the result of `createQino`; `z` is imported from `zod`.
Use `views: (view) => ({ default: view({ ... }), name: view({ ... }) })` for custom listing callbacks.
The helper knows the collection's schema, metadata, and relations, and infers
each view's augmented fields before typing its filter and sort. This helper syntax
is required for every custom view on all primitives. Trees and singletons expose
only `resolveRelations` and `augment` through their helpers.
The views factory runs once when the collection is created, not on each read.

## Behaviour

- `getAll()` runs source reading and schema validation, relation resolution,
  augmentation, filtering, then sorting. All augmentation (including async
  augmentation) finishes before filtering starts.
- `filter` receives one complete entry and retains it when the predicate returns
  `true`, following [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
- `sort` receives two retained entries and is passed to
  [Array.toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted).
  Negative results put `a` first; positive results put `b` first; zero or `NaN`
  preserves relative order. Sorting produces a new array.
- Callback parameters include validated fields, `_meta`, the selected view's
  resolved relations, and augmented fields. TypeScript exposes them as readonly.
- `views.default` defines the default behavior when views are supplied. Custom views inherit no
  settings or callbacks. A missing filter retains every entry; a missing sort
  preserves discovery order. No default date or alphabetical sort is imposed.
- Empty collections and filters that exclude every entry return `[]`.
  Thrown callback errors reject the getter. Filter and sort cannot be async.
- `getOne(slug, { view })` resolves and augments the requested entry, then runs
  the selected view’s filter. If excluded, it throws an error naming the slug,
  collection, and view. Omitting `view` applies the declared default filter, if any.
  It never sorts or reads the rest of the collection.
  Slug discovery, CLI validation, and embedded relation targets bypass
  filtering and sorting. Filtering never hides invalid content from validation.
- Trees retain `_order.json` ordering. Tree filtering is deferred; singletons
  have neither callback. No pagination is added by this feature.

## Deferred ideas

`compareAsc` / `compareDesc` helpers and collection order files are not part of
the implemented API. Manual ordering remains available on trees. Any future
collection order-file support needs its own design decision.

## Acceptance criteria

- Default and custom views infer callback inputs, including async augment output
  and resolved relations, without consumer annotations or casts when using the helper.
- Filtering completes before sorting, which only compares retained entries.
- Equal comparisons preserve input order; one view's sorting does not change
  subsequent reads or another view's output.
- Direct reads return entries accepted by the selected view’s filter and throw
  for excluded entries, including in the default view.
- Slug discovery, relations, and CLI validation ignore callbacks.
- Getter callback overrides are rejected in TypeScript and at runtime.
