# Relationships

**Status:** v1-proposed
**Version:** v1

## Intent

Managing relationships between collections is the single biggest pain point for plain Markdown CMSes. Qino's job is to make it ergonomic both at the schema level (declaring a relation) and at the getter level (resolving it).

Three things the developer must be able to express:

1. That a string field is a path to another collection's entry.
2. That the target file has a specific extension.
3. Whether the field resolves to one entry or many.

## API (proposed — pick one)

### Option A: Zod extension (preferred)

```ts
import { createCollection } from "qino";
import z from "zod";

const PostSchema = z.object({
  title: z.string(),
  author: z.qino().path("authors").extension(".json"),                // one
  categories: z.array(z.qino().path("categories").extension(".json")), // many
});
```

**Pros:** stays inside Zod, schemas remain composable, no new top-level export to learn.

### Option B: Standalone `Path` object

```ts
import { createCollection, Path } from "qino";

const PostSchema = z.object({
  title: z.string(),
  author: Path.to("authors").extension(".json"),
  categories: Path.to("categories").extension(".json").many(),
});
```

**Pros:** more discoverable in autocomplete; clearer that this isn't plain Zod.

> **Decision pending.** Default toward Option A unless DX testing shows otherwise.

## Lock-file representation

Either API compiles to the same lock-file shape (already shipping in `apps/blog/qino/qino-lock.json`):

```json
"relations": [
  { "field": "categories[]", "target": "categories", "cardinality": "many" },
  { "field": "author",       "target": "authors",    "cardinality": "one"  }
]
```

`field` uses `[]` suffix for arrays. The CLI derives this from the schema; the consumer never writes it by hand.

## Resolving relationships

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
> - `resolveDownstream` / `resolveUpstream`
> - `resolveChildren` / `resolveParents`
> - `resolveDirect` / `resolveIndirect`

## Behaviour

- Resolution traverses the lock file's `relations[]` to know which fields point where.
- Upstream resolution requires walking *all* sibling collections' relations to find inbound references; the lock file makes this O(n) over relation edges, not O(content).
- Cycles must be safe — repeat visits to the same entry resolve to the previously-resolved object reference, never re-fetched.
- A broken reference (target file missing) is a build-time error if found by `qino build`, and a runtime error otherwise.

## Open questions

- API choice (Option A vs B).
- Resolve naming (`Descendants` / `Ancestors` vs alternatives).
- Should `resolveAncestors` materialise inbound fields with predictable names (e.g. `posts` on an author)? If multiple collections point to the same target, how are field names disambiguated?
- Performance ceiling: at what collection size do we need indexing rather than linear scans?

## Acceptance criteria

Done when:

- A `posts` collection can declare `author: <relation>` and `categories: <relation>` and the lock file reflects both with correct cardinality.
- `getAllPosts({ resolveDescendants: true })` returns posts whose `author` and `categories` are full entries, not strings.
- `getAllAuthors({ resolveAncestors: true })` returns authors with a `posts` array.
- Broken references surface a clear error pointing at the offending file and field.
