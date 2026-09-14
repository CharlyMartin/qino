# Ideas

Running brainstorm. Nothing here is committed. Promote into a numbered spec once it has an owner and an API sketch.

## Folder layouts: `collections.ts` vs `collections/*.ts`

Two layouts on the table:

```
qino/
├── config.ts
├── qino-lock.json
├── collections/
│   ├── posts.ts
│   └── events.ts
├── pages/
│   ├── home.ts
│   └── blog.ts
└── trees/
    └── docs.ts
```

vs

```
qino/
├── config.ts
├── qino-lock.json
├── collections.ts
├── pages.ts
└── trees.ts
```

Open: support both? folder wins if both exist? Today the live example (`apps/blog/qino/`) uses the folder form.

## Sorting helpers from Qino

Expose `compareAsc` / `compareDesc` so consumers don't write their own sort fns:

```ts
import { createCollection, compareAsc } from "qino";

createCollection({ sort: compareAsc("created-on") });
```

Smart enough to infer comparator from the field type (date vs string vs number).

## Custom-ordered collections via JSON

For ordering that can't be programmatic:

```ts
createCollection({ sort: "posts/_order.json" });
// _order.json: ["a-post.md", "another-post.md", "yet-another-post.md"]
```

JSON (not TS) so the cloud UI can read/edit it from GitHub.

## Asset name patterns

Lock down media filenames so they aren't all `IMG_2391_final_v2.png`:

```ts
image: z.qino().asset(".jpg").local().name("a-regexp-pattern");
```

## Relation API alternatives

Two shapes for the relationship API:

```ts
// A: Zod extension
author: z.qino().path("authors").extension(".json"),

// B: standalone Path object
author: Path.to("authors").extension(".json"),
```

A is closer to how schemas are already authored. B is more discoverable.

## Resolve API naming

Open names for the same thing:

- `resolveDescendants` / `resolveAncestors`
- `resolveDownstream` / `resolveUpstream`
- `resolveChildren` / `resolveParents`
- `resolveDirect` / `resolveIndirect`

## Drafts / publish state

Not yet specified. Possible: a `draft: boolean` frontmatter field that getters filter out by default, plus `getMany({ includeDrafts: true })`.

## Search / filter depth

Collection `filter` and `sort` callbacks are configured at creation time, on the default or a custom view; see [06-sort](06-sort.md). Getter overrides are not supported. Pagination remains a future idea.
