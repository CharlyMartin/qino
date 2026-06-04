# Sort

**Status:** v1-proposed
**Version:** v1

## Intent

Most collections need stable, predictable ordering. Two common cases:

1. Programmatic — by date or alphabetically.
2. Manual — order set by an editor that can't be expressed as a function (e.g. handpicked featured posts).

Qino should support both with the same field.

## API (proposed)

### Programmatic — function

`sort` accepts a comparator passed to [`Array.prototype.toSorted`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted):

```ts
createCollection({
  sort: function sortByDate(a, b) {
    if (a["created-on"] < b["created-on"]) return -1;
    if (a["created-on"] > b["created-on"]) return 1;
    return 0;
  },
});
```

### Programmatic — Qino helpers

```ts
import { createCollection, compareAsc, compareDesc } from "qino";

createCollection({
  sort: compareAsc("created-on"),
});
```

`compareAsc` / `compareDesc` infer the comparator from the field type (string, number, ISO date).

### Manual — JSON order file

_Maybe this should not be possible -> collections can be ordered by the getter. If the user needs arbitrary ordering, use a tree_

For order that can't be programmatic — a list of filenames in the desired order:

```ts
createCollection({
  sort: "posts/_order.json",
});
```

```json
["a-post.md", "another-post.md", "yet-another-post.md"]
```

JSON (not TS) so the cloud UI can read and edit it from GitHub.

> **Decision pending.** The sketch had two shapes for the manual form: `sort: "posts/_order.json"` vs `sort: { path: "posts/_order.json" }`. Pick the bare-string form unless we need other knobs on the same field.

## Behaviour

- `sort` runs after schema validation, before `first`/`last` slicing.
- Manual order: entries not listed in the JSON file go _after_ listed entries, in stable filesystem order. (Decision: append vs error vs hide — append by default.)
- Per-call `getAll({ sort })` overrides the collection-level default.

## Open questions

- Manual-order behaviour when an entry isn't in `_order.json` — append, error, or hide?
- Can `compareAsc` accept multiple fields for tie-breaking (`compareAsc(["created-on", "title"])`)?
- Does the cloud UI need a known location for the order file (`<collection>/_order.json`), or can it be configured?

## Acceptance criteria

Done when:

- A collection can declare `sort: compareDesc("created-on")` and `getAll()` returns entries newest-first.
- A collection can declare `sort: "posts/_order.json"` and `getAll()` returns entries in JSON-listed order.
- Per-call `getAll({ sort })` overrides the default.
