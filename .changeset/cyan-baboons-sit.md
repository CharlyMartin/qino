---
"@qino/cms": minor
---

Changes how relations resolve: declared relations now resolve by default, and each relation can set its own depth. This is a breaking change.

#### Relations resolve by default

Views used to leave relations as strings unless they set `resolveRelations`. Now every view, including the implicit default, resolves each relation to its `resolveDepth`, which defaults to `1`: `post.author` is the author entry, and the author's own relations stay strings. To keep the old behavior in a view, set `resolveRelations: false`.

#### `resolveDepth` on relations

A relation can be declared as an object to set how many hops it resolves, from `0` (keep the string) to `6`:

```ts
relations: {
  author: { target: authorCollection, resolveDepth: 2 },
  related: { target: () => postCollection, resolveDepth: 0 },
},
```

A nested relation never resolves further than the hops left from its parent.

#### `resolveRelations` takes `{ depth }`

A view's `resolveRelations` now takes `true` (the default: each relation uses its `resolveDepth`), `false` (nothing resolves), or `{ depth }` from `0` to `6`, which sets the depth of every relation. Bare numbers are no longer accepted, and `true` no longer means depth `6`:

```diff
- detail: view({ resolveRelations: 2 }),
+ detail: view({ resolveRelations: { depth: 2 } }),
- full: view({ resolveRelations: true }),
+ full: view({ resolveRelations: { depth: 6 } }),
```
