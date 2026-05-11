# Upstream resolution

**Status:** v2-deferred
**Version:** v2

## Intent

Reverse traversal of relations: a target entry exposes the entries that reference it. An `authorCollection` entry resolved with upstream traversal gains a `posts` array of every post whose `author` field points at them.

`05-relationships.md` ships downstream resolution in v1 (`resolveRelations`). Upstream is the symmetric half — same lock-file data, different traversal direction. Deferred because the v1 surface (declarations + downstream) needs to land and bake first, and because the upstream path opens up new design questions (collisions, inbound naming, traversal cost) that don't need to be answered to ship v1.

## Sketch (not v1)

A symmetric getter option `resolveAncestors` mirroring `resolveRelations`'s shape — `true` / `number` / `false`, settable both on `createCollection` and per-call:

```ts
const authors = await authorCollection.getAll({ resolveAncestors: true });
// each author gains a `posts` field — array of every post that references them
```

### Inbound field naming default

The inbound field defaults to the source collection's `directory` with the leading `/` stripped. So `directory: "/posts"` → inbound key `posts` on every author entry.

### `inverse` collision rule

When two relations on the same source collection target the same collection (e.g. `posts.author` and `posts.editor` both → `authorCollection`), the default inbound name would collide. In that case each relation must declare an explicit `inverse` name via the object form:

```ts
relations: {
  author: { collection: authorCollection, inverse: "authoredPosts" },
  editor: { collection: authorCollection, inverse: "editedPosts" },
}
```

The build throws if a collision is detected without explicit `inverse` on every involved relation.

### Forward-compatibility with v1

The v1 shorthand (`relations: { author: authorCollection }`) is forward-compatible. The value type widens additively to accept the object form (`{ collection, inverse }`) when this lands — no breaking change for v1 consumers.

## Behaviour

- Upstream resolution requires walking _all_ sibling collections' relations to find inbound references. The lock file's `relations[]` makes this O(n) over relation edges, not O(content).
- Cycles handled the same as downstream: repeat visits to the same entry resolve to the previously-resolved object reference, never re-fetched.

## Why deferred

- The v1 surface (declarations + `resolveRelations`) must land and prove itself before bolting on the inverse direction.
- The collision rule changes the relation declaration shape (object form). Doing this additively is cheap; getting v1 right first is what matters.
- The type generator has to materialise inbound fields onto target entries — a separate, non-trivial chunk of work that's worth owning in its own PR.

## Open questions (held)

- Default for `resolveAncestors` — `false` (opt-in, since sibling traversal cost is real) vs `true` (consistency with `resolveRelations`)?
- Generated `.d.ts` types for upstream-resolved entries: build-time emitted bundle vs. runtime conditional types against the registry.
- Performance ceiling for sibling-relation scans at large collection counts — when do we need indexing rather than linear scans over relation edges?
- Should `resolveAncestors` and `resolveRelations` compose freely on the same call (i.e. an author with `posts` resolved, where each post has its `categories` resolved), or is mixing them too expensive in practice?

## Acceptance criteria (when v2 lands)

Done when:

- A `postCollection` with `author: authorCollection` causes `authorCollection.getAll({ resolveAncestors: true })` to return authors with a `posts` array of full post entries.
- Two-relation-same-target without explicit `inverse` throws at build time with a message pointing at the source collection and the colliding field names.
- The explicit `inverse` object form coexists with the v1 shorthand on the same `relations` map.
- Cycles between upstream and downstream resolution are safe — same object identity, no re-fetch.
