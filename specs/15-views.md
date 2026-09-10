# Views

**Status:** stable
**Version:** v1

## Intent

`augment` (see [08-augment](./08-augment.md)) derives fields from an
entry, and `resolveRelations` controls how deep relation fields get
expanded. Both are collection/tree/singleton config, but `resolveRelations`
previously was also overridable per getter call (`getAll({ resolveRelations:
2 })`). That flexibility conflicts with `augment`: an `augment`
function's return type is fixed once at config time and must be valid for
every possible per-call resolve depth, which is why `augment` previously
always saw the entry _before_ relations are resolved — it can never know
what shape the relation fields will end up in.

Two workarounds don't hold up:

- **A per-call `augment`** hits the same problem from the other side: the
  getter's return type would need to merge a call-time-only type into an
  already-fixed `Derived` type, and inferring a return-type-shaping generic
  from a callback nested in an options object is unreliable in TypeScript.
- **Two `createCollection` calls over the same directory** (one plain, one
  with `augment`) don't actually give two interchangeable views of the
  same content: relations are declared as direct references to one specific
  collection object (e.g. `relations: { author: () => authorCollection }`),
  so anything relating to that content is locked to whichever instance it
  names.

**Views** fix this by pairing `resolveRelations` and `augment` together,
per named view, at config time — so within a single view there's no
per-call variability left to reconcile, and `augment` can safely run
after relation resolution when that view resolves them.

## API

Existing flat configuration syntax remains supported — it's shorthand for a single
`default` view:

```ts
export const { getAll, getOne } = createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string() }),
  resolveRelations: true,
  augment: (post) => ({
    readingMinutes: Math.ceil(markdown.stats(post.body).wordCount / 220),
  }),
});
```

An optional `views` factory defines named shapes on collections, trees, and singletons:

```ts
export const { getAll, getOne } = createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string(), author: z.string() }),
  relations: { author: () => authorCollection },
  views: (view) => ({
    listing: view({
      resolveRelations: false,
    }),
    detail: view({
      resolveRelations: true,
      augment: (post) => ({
        readingMinutes: Math.ceil(markdown.stats(post.body).wordCount / 220),
      }),
    }),
  }),
});

const posts = await getAll({ view: "listing" }); // post.author is a raw content-path string
const post = await getOne("hello-world", { view: "detail" }); // post.author is the resolved author entry; post.readingMinutes exists
```

`getAll()` / `getOne(slug)` called with no `view` use the flat top-level
config, even when named views exist. This is the implicit default view.
`"default"` is reserved: it cannot appear in `views` or be passed to a getter.
Only declared custom view names autocomplete and type-check. Unknown names
also fail at runtime.

## Required primitive-specific helpers

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

## Behaviour

- A view is `{ resolveRelations?: ResolveOption; augment?: EntryAugment<...> }`.
  Both keys are independently optional; a missing `resolveRelations`
  defaults to `false` and a missing `augment` means no derived fields —
  the same defaults as the flat top-level config.
- Views **do not inherit from each other**, and named views do **not**
  inherit from the flat/default config either. Each view falls back to the
  same baseline defaults (`resolveRelations: false`, no augment), not to
  whatever a sibling view or the top-level flat config specifies.
- Explicit `undefined` in getter options is treated as omission. Non-undefined
  overrides, including `null`, are rejected. Tree/singleton view validation
  likewise ignores undefined filter/sort values but rejects actual values.
- `resolveRelations` is no longer overridable at any getter call site,
  including primitives without named views. The `view` name is the only per-call knob; it selects a
  config-time-fixed `{ resolveRelations, augment }` pair.
- Ordering, per view: if the view's `resolveRelations` is truthy, relations
  are resolved first and `augment` receives the resolved entry. If
  `resolveRelations` is `false`, `augment` receives the raw (unresolved)
  entry — there's nothing to resolve first.
- Nested relation resolution is unaffected by any of this. When an entry is
  embedded as a relation target (e.g. `author` inside a post), it's still
  built purely from the target's schema and relations
  (`ResolveRelationTarget` in `types/resolve.ts`) — the target's own views
  and augment never apply. An embedded `author` never carries
  `authorCollection`'s derived fields, regardless of which view resolved
  the post.
- Available on `createCollection`, `createTree`, and `createSingleton`
  alike.

## Collection listing callbacks

Collections additionally support top-level `filter` and `sort` callbacks. To
configure them in custom views with fully inferred augmented entry types, use
`views: (view) => ({ listing: view({ resolveRelations, augment, filter, sort }) })`.
All four options are optional. The factory runs once at collection creation;
`view` only constructs a configuration and does not load entries or run callbacks.
Every custom view must use the helper, even without filter or sort.

For `getAll()`, the selected view runs relation resolution → augment → filter →
sort. Filter and sort are synchronous and receive the augmented entry shape.
Named views inherit neither top-level callbacks nor other settings. `getOne`
uses the same view's resolution, augmentation, and filter. An excluded entry
throws an error naming the slug, collection, and view. This also applies to the
implicit default view. Sorting only runs for `getAll()`.
Trees and singletons use the same helper syntax but expose only resolution and augmentation.
See [06-sort](./06-sort.md).

## Implementation decisions

- Removing getter resolution overrides is an intentional breaking change.
  Top-level configuration remains the default view, but its augment now runs
  after its configured relation resolution, just like named views.
- Keep the existing name `resolveRelations`. Resolution now defaults to `false`
  in both top-level configuration and named views. Existing consumers relying
  on implicit resolution must add `resolveRelations: true` or a numeric depth.
  Without it, getters and augment callbacks receive raw references.
- CLI content validation and slug generation use internal source readers.
  They validate schema data without resolving content references or executing
  default/named augments. Existing relation configuration checks remain.
- Relation loading also uses source readers, ensuring target views and augments
  never execute or contribute derived fields.
- Augment callbacks may be synchronous or asynchronous; factories, filters, and comparators are synchronous. Existing conflict checks
  and file-specific augment errors apply.

## Acceptance criteria

Done when:

- The flat `resolveRelations`/`augment` top-level config remains supported and is equivalent to a single implicit `default` view.
- A collection/tree/singleton can declare `views: (view) => ({ name: view({ resolveRelations, augment }) })`, and `getAll`/`getOne`/`getEntry`/
  `getData` accept a `view` option to select one, using the implicit default when `view` is omitted. Explicit `"default"`
  and undeclared view names are rejected.
- Omitting resolution keeps references raw in both getter results and augment
  callback inputs, including an empty named view beside a resolving default.
- For a view with `resolveRelations` truthy, `augment`'s parameter type
  reflects the resolved entry shape (relation fields as their resolved
  types, not raw slugs), inferred without `as` casts.
- Nested relation resolution behavior and types are unchanged from
  [08-augment](./08-augment.md).

- Legacy object-form views and unwrapped definitions fail at compile time and runtime.
- Only collection helpers offer filter/sort; tree and singleton helpers reject them.
