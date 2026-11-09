---
"@qino/cms": minor
---

Changes how relations resolve: declared relations now resolve by default, each relation sets its own depth, and views set depths by relation with `resolveDepth`, which replaces `resolveRelations`. This is a breaking change.

#### Relations resolve by default

Views used to leave relations as strings unless they set `resolveRelations`. Now every view, including the implicit default, resolves each relation to its `resolveDepth`, which defaults to `1`: `post.author` is the author entry, and the author's own relations stay strings. To keep a relation a string everywhere, declare it with `resolveDepth: 0`.

#### `resolveDepth` on relations

A relation can be declared as an object to set how many hops it resolves, from `0` (keep the string) to `6`:

```ts
relations: {
  author: { target: authorCollection, resolveDepth: 2 },
  related: { target: () => postCollection, resolveDepth: 0 },
},
```

A nested relation never resolves further than the hops left from its parent.

#### `resolveDepth` in views replaces `resolveRelations`

A view sets the depth of the relations it lists, keyed by relation path. Relations it leaves out use their own `resolveDepth`, and a depth the view sets applies to the whole branch below that relation. A path that isn't a relation, or a depth outside `0` to `6`, is a type error and throws at definition:

```diff
- detail: view({ resolveRelations: 2 }),
+ detail: view({ resolveDepth: { author: 2 } }),
- raw: view({ resolveRelations: false }),
+ raw: view({ resolveDepth: { author: 0, "categories[*]": 0 } }),
- full: view({ resolveRelations: true }),
+ full: view({ resolveDepth: { author: 6, "categories[*]": 6 } }),
```

`view()` throws when given `resolveRelations`, and getters throw on `resolveDepth` as they did on `resolveRelations`: select a view instead.
