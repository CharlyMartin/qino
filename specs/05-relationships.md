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
import { authors } from "./authors";
import { categories } from "./categories";

const PostSchema = z.object({
  title: z.string(),
  author: z.string(),                    // 1:1
  categories: z.array(z.string()),       // 1:n
});

export const posts = createCollection({
  path: "posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authors,
    categories: categories,
    // Forward refs / cycles use thunks:
    // featured: () => posts,
  },
});
```

### How the three things are expressed

1. **String → another collection.** The value at the relation key (`author: authors`) is the target collection. Its path and extension live on the target — Qino reads them at build time.
2. **Target extension.** Carried by the referenced collection's `extension` field; not redeclared.
3. **Cardinality.** Inferred from the schema's output type:
   - `string` field → `"one"`
   - `Array<string>` field → `"many"`
   - Confirmed at build time by inspecting validated data.

The TypeScript type system enforces that only `string` or `Array<string>` fields can be relations; anything else is a compile error.

## Lock-file representation

`qino build` walks each registered collection, validates every entry, and emits the lock file:

```json
"relations": [
  { "field": "categories", "target": "categories", "cardinality": "many" },
  { "field": "author",     "target": "authors",    "cardinality": "one"  }
]
```

`field` is the schema key verbatim (no `[]` suffix). The CLI derives `cardinality` from a sample validated entry; the consumer never writes this by hand.

## Build pipeline guarantees

`qino build` enforces three invariants per collection:

1. **All entries validate.** Any schema failure throws with the offending file path.
2. **Folder is non-empty.** Zero entries → throw. A collection must have at least one entry.
3. **Every declared relation is exercised.** If `posts.categories` is declared as a relation but no post has `categories` defined, the build throws with a message asking for a sample entry that exercises the field.

Together these guarantee the lock file's `cardinality` is always concrete (never `"unknown"`).

## Resolving relationships [v1-proposed]

Once relations are declared, getters can resolve them — both downstream (a post's author and categories) and upstream (an author's posts).

```ts
const posts = await getAllPosts({ resolveDescendants: true });
// each post has `author` and `categories` replaced with full entries

const authors = await getAllAuthors({ resolveAncestors: true });
// each author gains a `posts` array of full post entries
```

`resolveDescendants` / `resolveAncestors` accept:

- `true` — resolve everything reachable.
- `1 | 2 | 3 | …` — resolve up to N levels.
- (default) `false` — return raw string paths.

Defaults can be set on `createCollection`; per-call options override.

> **Decision pending** on the names. Alternatives:
>
> - `resolveDownstream` / `resolveUpstream`
> - `resolveChildren` / `resolveParents`
> - `resolveDirect` / `resolveIndirect`

### Inbound (upstream) field naming

When `resolveAncestors: true` materialises inbound references on a target entry, the inbound field defaults to the source collection's `path`. So an author resolved with `resolveAncestors: true` gains a `posts` field listing every post that references them.

When two relations on the same source collection point at the same target (e.g. `posts.author` and `posts.editor` both → `authors`), the default would collide. In that case each relation must declare an explicit `inverse` name:

```ts
relations: {
  author: { collection: authors, inverse: "authoredPosts" },
  editor: { collection: authors, inverse: "editedPosts" },
}
```

The build throws if a collision is detected without explicit `inverse` on every involved relation.

> **Status:** the `inverse` syntax, the upstream resolver, and full type-safety on resolved upstream entries land together in a follow-up PR. The shorthand (`relations: { author: authors }`) is forward-compatible — the value type widens to accept the object form additively.

## Behaviour

- Resolution traverses the lock file's `relations[]` to know which fields point where.
- Upstream resolution requires walking _all_ sibling collections' relations to find inbound references; the lock file makes this O(n) over relation edges, not O(content).
- Cycles must be safe — repeat visits to the same entry resolve to the previously-resolved object reference, never re-fetched. Forward-ref cycles in `relations` are supported via thunks (`() => collection`).
- A broken reference (target file missing) is a build-time error if found by `qino build`, and a runtime error otherwise.

## Open questions

- Resolve naming (`Descendants` / `Ancestors` vs alternatives).
- Generated `.d.ts` types for upstream-resolved entries: walk the registry at build time and emit a typed bundle, vs. runtime conditional types using the registry.
- Performance ceiling: at what collection size do we need indexing rather than linear scans?

## Acceptance criteria

Done when:

- A `posts` collection can declare `author: <relation>` and `categories: <relation>` and the lock file reflects both with correct cardinality.
- `getAllPosts({ resolveDescendants: true })` returns posts whose `author` and `categories` are full entries, not strings.
- `getAllAuthors({ resolveAncestors: true })` returns authors with a `posts` array.
- Broken references surface a clear error pointing at the offending file and field.
