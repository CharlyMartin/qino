# Relationships

**Status:** stable (declaration), v1-proposed (resolution)
**Version:** v1

## Intent

Managing relationships between collections is the single biggest pain point for plain Markdown CMSes. Qino's job is to make it ergonomic both at the schema level (declaring a relation) and at the getter level (resolving it).

Three things the developer must be able to express:

1. That a string field is a path to another collection's entry.
2. That the target file has a specific extension.
3. Whether the field resolves to one entry or many.

## API

Relations are declared on `createCollection` via a `relations` map. Schemas stay vanilla — no augmentation, no custom helpers. The target's path and extension are read off the referenced collection (single source of truth).

```ts
import { createCollection } from "qino";
import z from "zod";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z.object({
  title: z.string(),
  author: z.string(), // 1:1
  categories: z.array(z.string()), // 1:n
});

export const postCollection = createCollection({
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
    // Forward refs / cycles use thunks:
    // featured: () => postCollection,
  },
});
```

### How the three things are expressed

1. **String → another collection.** The value at the relation key (`author: authorCollection`) is the target collection. Its path and extension live on the target — Qino reads them at build time.
2. **Target extension.** Carried by the referenced collection's `extension` field; not redeclared.
3. **Cardinality.** Derived purely from the relation key (the JSON path). Any `[*]` anywhere in the key → `"many"`; otherwise `"one"`. `[*]` is transitive — `articles[*].author` is `"many"` even though the leaf is a single field. No build-time data scan is needed.

The TypeScript type system enforces that the path's leaf is `string` after walking object descents (`a.b`) and array descents (`field[*]`); anything else is a compile error.

## Lock-file representation

`qino build` walks each registered collection, validates every entry, and emits the lock file:

```json
"relations": [
  { "field": "categories[*]", "target": "/categories", "kind": "collection", "cardinality": "many" },
  { "field": "author",        "target": "/authors",    "kind": "collection", "cardinality": "one"  }
]
```

`field` is the relation key verbatim — `[*]` segments preserved. `kind` is `"collection"` or `"singleton"` depending on what the relation points at; consumers reading the lock file use it to decide whether to look up the target in the `collections` or `singletons` section. `cardinality` is derived from the path itself (no data scan); the consumer never writes either of these by hand.

## Relation value format

A relation field in a content file stores the **full path of the target entry relative to `contentFolder`**: the target collection's folder, the slug, and the target's extension.

```yaml
# src/content/posts/hello.md frontmatter
author: "authors/jane-doe.json"
categories:
  - "categories/architecture.json"
  - "categories/philosophy.json"
```

At resolve time, for a **collection target** the resolver:

1. Asserts the value is under the target collection's `directory` (leading `/` is tolerated on the value).
2. Asserts the value ends with the target collection's `extension`.
3. Strips both and passes the remaining slug to `targetCollection.getOne(slug)`.

A mismatched prefix, a mismatched extension, or an empty string throws at resolve time with the source `_meta.filePath`, the relation key, and the offending value. Bare slugs (e.g. `author: "jane-doe"`) are **not** accepted — the verbose form is the only valid format. This trades a few extra characters per entry for self-documenting frontmatter and prefix-mismatch detection at the boundary.

For a **singleton target** (see [03-singletons.md](03-singletons.md)), the value must equal the target singleton's `file` exactly (leading `/` is tolerated). The prefix+extension pair collapses to a single equality check because a singleton has exactly one file. On match the resolver calls `targetSingleton.getData({ resolveRelations: false })`; on mismatch it throws naming the expected file, the relation key, and the source file path.

## Build pipeline guarantees

`qino build` enforces two invariants per collection:

1. **All entries validate.** Any schema failure throws with the offending file path.
2. **Folder is non-empty.** Zero entries → throw. A collection must have at least one entry.

## Resolving relationships [v1-proposed]

Once relations are declared, getters resolve them by default — each declared relation's raw string path(s) are replaced with the full target entry.

```ts
const posts = await postCollection.getAll();
// each post has `author` and `categories` replaced with full entries
```

`resolveRelations` accepts:

- (default) `true` — resolve everything reachable.
- `1 | 2 | 3 | …` — resolve up to N levels.
- `false` — return raw string paths.

It can be set in two places:

- On `createCollection` — sets the collection-wide default for every getter call.
- On a getter call (`getAll` / `getOne`) — overrides the collection default for that call only.

> Reverse traversal (an author gaining a `posts` array of every entry that references them) is deferred to v2 — see [14-upstream-resolution.md](14-upstream-resolution.md).

## Behaviour

- Resolution traverses the lock file's `relations[]` to know which fields point where.
- Cycles must be safe — repeat visits to the same entry resolve to the previously-resolved object reference, never re-fetched. Forward-ref cycles in `relations` are supported via thunks (`() => collection`).
- A broken reference (target file missing) is a build-time error if found by `qino build`, and a runtime error otherwise.

## Open questions

- Should we need install [jsonpath](https://www.npmjs.com/package/jsonpath)?
- Generated `.d.ts` types for resolved entries: walk the registry at build time and emit a typed bundle, vs. runtime conditional types using the registry.
- Performance ceiling: at what collection size do we need indexing rather than linear scans?

## Acceptance criteria

Done when:

- A `postCollection` can declare `author: <relation>` and `categories: <relation>` and the lock file reflects both with correct cardinality.
- `postCollection.getAll()` returns posts whose `author` and `categories` are full entries, not strings (relations resolve by default). Passing `{ resolveRelations: false }` returns the raw string paths instead.
- Broken references surface a clear error pointing at the offending file and field.
