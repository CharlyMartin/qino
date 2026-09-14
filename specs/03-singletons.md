# Singletons

**Status:** stable
**Version:** v1

## Intent

A singleton is a single, well-known content file with its own role in the consumer app — `home.md`, `about.md`, `site-config.json`. Distinct from a one-entry collection because:

- The file path is fixed and known at author time. There is no slug lookup.
- The schema is per-file, not per-folder.
- The cloud UI renders singletons as named entries in the dashboard, not as rows in a table.

The name `createSingleton` describes the structural property (exactly one, fixed path) rather than a use case, so it covers `home`, `siteConfig`, `seoDefaults`, etc. equally well.

## Custom views

Declare custom views with `views: (view) => ({ default: view({}), detail: view({ ... }) })`.
The helper accepts only `resolveRelations` and `augment`; it does not offer
filter or sort. Unsupported callbacks, object-form `views`, and definitions
not created by `view()` are rejected. `views.default` is required when views are supplied. Omitting views uses baseline
behavior. Root view settings are forbidden, and custom views inherit no settings. See [15-views](./15-views.md).

## API

```ts
// qino/singletons/home.ts
import { createSingleton } from "qino";
import z from "zod";
import { postCollection } from "../collections/posts";

export const homeSingleton = createSingleton({
  file: "/pages/home.md", // relative to config.contentFolder; must start with "/"
  schema: z.object({
    hero: z.object({
      title: z.string(),
      subtitle: z.string(),
    }),
    "featured-posts": z.array(z.string()),
    body: z.string(),
  }),
  relations: {
    "featured-posts[*]": postCollection,
  },
});
```

```ts
const home = await homeSingleton.getData();
const homeRaw = await homeSingleton.getData({ view: "raw" });
```

The extension is inferred from `file`'s suffix — one of `.md` | `.mdx` | `.json`. No separate `extension` key.

## Behaviour

- The file must exist at the declared path. Missing file → build-time error.
- `_meta` is `{ fileName, filePath }`. No `slug` — singletons have no slug.
- `.md`, `.mdx`, and `.markdown` parse via `gray-matter` and expose the body as `body`. `.json` parses straight.

### Returned shape

```ts
{
  _meta: {
    fileName: string,    // "home.md"
    filePath: string,    // absolute path on disk
  },
  ...validatedFields
}
```

### `getData` signature

```ts
getData({ view? })
```

Set `resolveRelations` (`true` / `number` / `false`, default `false`) inside `views.default` or a custom view. Root view settings are forbidden. Getters select a declared view; they cannot override its depth. Omitting `view` selects the declared default, or baseline behavior when views are omitted. Explicit `"default"` selection is allowed when declared. See [15-views](./15-views.md).

### `relations`

Optional. Same JSON-path grammar as collections (`a.b`, `field[*]`, with `[*]` anywhere → `cardinality: "many"`). Targets can be **any collection, tree, or singleton**, or a thunk `() => target` for forward refs.

For collection targets, the relation value format is the same as in [05-relationships.md](05-relationships.md): `<directory>/<slug><extension>` (verbose form; leading `/` tolerated).

For **singleton targets**, the value must equal the target singleton's `file` (leading `/` tolerated). This is the singleton analogue of the prefix+extension check used for collection and tree targets — collapsed to a single equality because a singleton has exactly one file:

```yaml
# src/content/pages/about.md frontmatter
siteConfig: "config/site.json"
```

A value that doesn't match throws at resolve time naming the expected file, the relation key, and the source file path.

## Lock-file entry

```json
"singletons": {
  "/pages/home.md": {
    "file": "/pages/home.md",
    "relations": [
      { "field": "featured-posts[*]", "target": "/posts", "kind": "collection", "cardinality": "many" }
    ]
  }
}
```

The extension is intentionally not stored — it's derivable from `file`'s suffix (one of `.md` | `.mdx` | `.json`), the same way `createSingleton` derives it at runtime.

The `kind` discriminator on each relation tells consumers reading the lock file whether the target is a collection, tree, or singleton. The same `kind` is emitted in collection relations (see [02-collections.md](02-collections.md) and [05-relationships.md](05-relationships.md)).

## Build pipeline

`qino build` walks `qino/singletons/*.{ts,tsx,js,mjs}`, validates each singleton's file against its schema, and emits the lock entry. The `qino/singletons/` folder is **optional** — projects with no singletons skip it without error.

## Acceptance criteria

Done when:

- `createSingleton` returns a typed `getData()` that validates the file's contents against the schema.
- Singletons appear in `qino-lock.json` under `singletons.<file>`.
- Missing singleton files fail at build time, not runtime.
- Relations declared on a singleton resolve at read time the same way as on collections.
- Relations on collections, trees, or singletons can target other singletons; the relation value format is an exact-equality check against the target's `file`.
