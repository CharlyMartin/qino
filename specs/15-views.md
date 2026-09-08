# Views

**Status:** v1-proposed
**Version:** v1

## Intent

`augment` (see [08-augment](./08-augment.md)) derives fields from an
entry, and `resolveRelations` controls how deep relation fields get
expanded. Both are collection/tree/singleton config, but `resolveRelations`
has always also been overridable per getter call (`getAll({ resolveRelations:
2 })`). That flexibility conflicts with `augment`: an `augment`
function's return type is fixed once at config time and must be valid for
every possible per-call resolve depth, which is why `augment` currently
always sees the entry _before_ relations are resolved — it can never know
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

Existing flat config keeps working unchanged — it's shorthand for a single
`default` view:

```ts
export const { getAll, getOne } = createCollection({
  directory: "posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string() }),
  resolveRelations: true,
  augment: (post) => ({
    readingMinutes: Math.ceil(markdown.stats(post.body).wordCount / 220),
  }),
});
```

A `views` object is additive, for collections that need more than one
shape:

```ts
export const { getAll, getOne } = createCollection({
  directory: "posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string() }),
  relations: { author: () => authorCollection },
  views: {
    listing: {
      resolveRelations: false,
    },
    detail: {
      resolveRelations: true,
      augment: (post) => ({
        readingMinutes: Math.ceil(markdown.stats(post.body).wordCount / 220),
      }),
    },
  },
});

const posts = await getAll({ view: "listing" }); // post.author is a raw slug string
const post = await getOne("hello-world", { view: "detail" }); // post.author is the resolved author entry; post.readingMinutes exists
```

`getAll()` / `getOne(slug)` called with no `view` (and no `views` config at
all) use the flat top-level config, i.e. the implicit `default` view.

## Behaviour

- A view is `{ resolveRelations?: ResolveOption; augment?: EntryAugment<...> }`.
  Both keys are independently optional; a missing `resolveRelations`
  defaults to `true` and a missing `augment` means no derived fields —
  the same defaults the flat top-level config already has today.
- Views **do not inherit from each other**, and named views do **not**
  inherit from the flat/default config either. Each view falls back to the
  same baseline defaults (`resolveRelations: true`, no augment), not to
  whatever a sibling view or the top-level flat config specifies.
- `resolveRelations` is no longer overridable at the getter call site once
  `views` is used. The `view` name is the only per-call knob; it selects a
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

## Open questions

- The existing (already-implemented) `GetterOptions<R>` lets
  `resolveRelations` be overridden per call today, independent of
  `augment`. Introducing `views` should retire that per-call override in
  favor of view selection — keeping both would let a caller request a
  view's `augment` while separately forcing `resolveRelations: false`,
  breaking the exact type assumption (augment typed against the resolved
  shape) that views exist to make safe. Confirm this is an intentional
  breaking change to the just-merged augment work, and decide whether
  `resolveRelations` stays as a getter option at all once `views` exists,
  or moves into `views` exclusively.
- `fetchRelations` came up in conversation but the codebase's existing
  field is `resolveRelations` (`CreateCollectionParams`, `GetterOptions<R>`)
  — this doc uses `resolveRelations` for consistency; confirm before
  implementing.
- Does `qino build`/`qino check` (spec 10) need to validate anything
  view-specific (e.g. that `view` names referenced elsewhere are valid), or
  is this purely a runtime/type-level concern?

## Acceptance criteria

Done when:

- The flat `resolveRelations`/`augment` top-level config continues to
  work unchanged and is equivalent to a single implicit `default` view.
- A collection/tree/singleton can declare `views: Record<string, {
resolveRelations?, augment? }>`, and `getAll`/`getOne`/`getEntry`/
  `getData` accept a `view` option to select one, defaulting to `default`.
- For a view with `resolveRelations` truthy, `augment`'s parameter type
  reflects the resolved entry shape (relation fields as their resolved
  types, not raw slugs), inferred without `as` casts.
- Nested relation resolution behavior and types are unchanged from
  [08-augment](./08-augment.md).
