# Views

**Status:** stable
**Version:** v1

## Intent

Views pair relation resolution with augmentation at configuration time, so each
callback receives one known entry shape. Collections also support filtering and
sorting of that augmented shape. Reuse is explicit through ordinary object
spread; views never inherit settings from other views.

## Configuration

`views` is optional on `defineCollection`, `defineTree`, and `defineItem`.
Without views, getters return validated content with `_meta`, raw relation
references, and no augmentation, filtering, or sorting.

When supplied, `views` must be a synchronous callback returning an object with
an own `default` property and any number of custom names. Every definition must
be created with the supplied `view` helper. The factory executes once during
primitive creation; constructing a view does not load content or run callbacks.

```ts
const posts = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
    highlight: z.boolean(),
  }),
  views: (view) => {
    const base = view({
      augment: (post) => ({ stats: getMarkdownStats(post.markdown) }),
      sort: (a, b) => b.stats.wordCount - a.stats.wordCount,
    });
    return {
      default: base,
      highlight: view({ ...base, filter: (post) => post.highlight }),
      raw: view({}),
    };
  },
});
```

`resolveRelations`, `augment`, `filter`, and `sort` are forbidden at the root,
whether or not views are configured. Structural settings such as schema,
relations, paths, and tree ordering remain at the root. Root settings whose value
is explicitly `undefined` are treated as omitted.

| Option             | Collection | Tree | Item |
| ------------------ | ---------- | ---- | ---- |
| `resolveRelations` | Yes        | Yes  | Yes  |
| `augment`          | Yes        | Yes  | Yes  |
| `filter`           | Yes        | No   | No   |
| `sort`             | Yes        | No   | No   |

All view options are optional. An empty `view({})` leaves relations unresolved
and adds no callbacks. Tree and item helpers reject filter and sort in
TypeScript and at runtime, including collection helper results passed to them.
Undefined values are treated as omitted; supplied values such as `null` are rejected.

## Selection and output inference

With views configured, `getMany()` / `getOne(slug)` / `getEntry(slug)` / `getData()`
select the declared default. `{ view: "default" }` selects the same configuration.
Other declared names select their own configurations. Explicit undefined selection
is equivalent to omission. Unknown names fail in TypeScript and at runtime.
Without views, no view names are available, including `"default"`.

```ts
const defaults = await posts.getMany();
const same = await posts.getMany({ view: "default" });
const highlights = await posts.getMany({ view: "highlight" });

import type { Infer } from "qino";
type Post = Infer<typeof posts>["output"];
type DefaultPost = Infer<typeof posts>["views"]["default"]; // same as Post
type HighlightPost = Infer<typeof posts>["views"]["highlight"];
```

Outputs include validated schema transformations, relation resolution, awaited
augmentation, primitive-specific `_meta`, and schema-defined `markdown` output. Collection outputs describe one
entry; tree outputs describe content entries rather than navigation nodes.
Literal selections preserve exact outputs. Unions of names produce output unions;
optional selections include the default output.

`Infer<T>["output"]` always matches an omitted-selection getter. With no views,
its output is the baseline entry and its `views` mapping has no keys. Otherwise,
the mapping includes all declared names, including `default`. The descriptor has
no runtime representation and does not collide with content fields called
`output` or `views`. Widening a primitive to an internal generic type erases its
inference metadata, so `Infer` returns `never`.

## Execution and reuse

- The selected view runs relation resolution, then augmentation. Collection
  `getMany()` awaits all augmentation before filtering, then sorts retained entries.
  `getOne()` applies the same filter and throws when the entry is excluded;
  its error identifies the slug, collection, and selected view. It never sorts.
- Augmentation may be synchronous or asynchronous; filters and comparators are
  synchronous. Existing output conflict checks and source-path errors apply.
- Each view independently defaults to `resolveRelations: false` and no callbacks.
  Custom views inherit nothing from default. Spread is normal JavaScript override
  behavior, with TypeScript checking callback compatibility against entry shapes.
- Helpers infer schema, metadata, resolution, and augmented fields locally, so
  reuse within the factory needs no helper type annotations.
- Getter resolution, filter, and sort overrides are rejected. Explicit undefined
  override values remain equivalent to omission.
- Embedded relation targets use only their schema and relations. Their own views,
  augmentation, filtering, and sorting never execute or contribute fields.
- CLI validation and source readers do not execute views. Slug enumeration and
  tree navigation remain independent of view selection; tree ordering still uses
  `_order.json`.

Spread replaces a supplied callback rather than layering behavior or merging
augmentation outputs. For example, inside a factory:

```ts
const summary = view({
  ...base,
  augment: (entry) => ({ titleLength: entry.title.length }),
  filter: undefined,
  sort: undefined,
});
```

This replaces the base augmentation with `titleLength` and clears its filter and
sort. The base's derived fields are absent. Use explicit `undefined` to remove a
copied callback; leaving the property out keeps the copied value.

## Migration and acceptance

This is a breaking change: move all root view settings into `views.default` and
add a helper-created default to existing factories. Use `default: view({})` when
existing no-selection reads used baseline behavior. Primitives without settings
may continue omitting views entirely. Object-form views remain unsupported.

Acceptance requires runtime and type coverage for omitted views, default-only
factories, custom selection, missing or invalid defaults, forbidden root settings,
output inference, and spread reuse with compatible and incompatible relation
shapes. Existing source readers, embedded relations, and structural navigation
must retain their behavior.
