# Lock file

**Status:** deferred (V2 — designed for the cloud UI, not emitted today)
**Version:** v2

## Current behaviour (V1)

`qino build` does **not** emit a lock file. It loads `qino/index.ts` (which calls
`createQino({...})`), discovers all primitives via the side-effect imports of
`qino/collections/*`, `qino/singletons/*`, `qino/trees/*`, then validates schemas,
paths, relations, and (eventually) generates `.d.ts` types. Runtime getters read the
config from each primitive's in-memory `QinoPrimitiveMarker` — no JSON contract on disk.

The rest of this spec describes the **future** lock-file artifact, which will land
alongside the cloud UI work in `13-cloud-ui.md`.

## Intent (V2)

`qino/qino-lock.json` will be the single artifact produced by `qino build --ui` (or
equivalent opt-in). Its only consumer is the **cloud UI**, which fetches it from
GitHub to render the editing dashboard. The cloud UI never imports `qino/index.ts`
or `qino/collections/*.ts`; the lock file is its only contract with the project.

Because the cloud UI is a downstream consumer over GitHub, the lock file is **JSON,
committed to the repo, and forward-compatible**.

## Canonical shape

```json
{
  "qinoVersion": "0.0.0",
  "config": {
    "contentFolder": "src/content",
    "mediaFolder": "public"
  },
  "collections": {
    "authors": {
      "path": "authors",
      "extension": ".json",
      "relations": []
    },
    "categories": {
      "path": "categories",
      "extension": ".json",
      "relations": []
    },
    "posts": {
      "path": "posts",
      "extension": ".md",
      "relations": [
        {
          "field": "categories[]",
          "target": "categories",
          "kind": "collection",
          "cardinality": "many"
        },
        {
          "field": "author",
          "target": "authors",
          "kind": "collection",
          "cardinality": "one"
        }
      ]
    }
  }
}
```

This is exactly the shape committed at `apps/blog/qino/qino-lock.json`. Treat it as the canonical example.

## Field reference

| Field                          | Type                                        | Notes                                                                  |
| ------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------- |
| `qinoVersion`                  | string                                      | The version of `qino` that produced this file. Used for migration.     |
| `config.contentFolder`         | string                                      | Mirrors `qino/config.ts`. Path relative to repo root.                  |
| `config.mediaFolder`           | string                                      | Same.                                                                  |
| `collections.<id>.path`        | string                                      | Relative to `contentFolder`.                                           |
| `collections.<id>.extension`   | `".md" \| ".mdx" \| ".json"`                | File extension for entries.                                            |
| `collections.<id>.relations[]` | array                                       | Declared relationships (see `05-relationships.md`).                    |
| `relations[].field`            | string                                      | Field name in the entry. `[]` suffix for arrays (e.g. `categories[]`). |
| `relations[].target`           | string                                      | Target collection, tree, or singleton id.                              |
| `relations[].kind`             | `"collection"` \| `"tree"` \| `"singleton"` | Selects the target section.                                            |
| `relations[].cardinality`      | `"one" \| "many"`                           | Whether the field resolves to one or many entries.                     |

V1 will also include:

- `pages.<id>` — see `03-pages.md`.
- `trees.<id>` — see `04-trees.md`.

## Implementation status

- 🛑 Lock-file generation is **not implemented** in the current CLI. The previous
  prototype that wrote `qino-lock.json` was removed when the runtime stopped reading
  it (in favour of in-memory `createQino` config).
- 🟡 Will be reintroduced behind an explicit opt-in flag when the cloud UI work
  begins. Until then, runtime config and schema validation are driven entirely from
  the `createQino` instance and per-primitive `QinoPrimitiveMarker`.

## Behaviour (V2)

- Hand-editing `qino-lock.json` will **not** be supported. It's a build artifact.
- The file will be **committed** to the repo. The cloud UI reads it from GitHub.
- Validation happens at write time in `qino build --ui`. Runtime no longer reads it.

## Open questions

- Should `qino-lock.json` include the Zod schema serialisation (e.g. via `zod-to-json-schema`) so the cloud UI can render forms? Likely yes — needs spec.
- Migration policy when `qinoVersion` changes — automatic on `qino build`, or explicit `qino migrate`?
- Pretty-print vs minified — currently pretty-printed for git diffs. Keep that.

## Acceptance criteria (V2)

Done when:

- An opt-in flag (working name `--ui` or a `ui: true` option on `createQino`) makes
  `qino build` emit a lock file matching the canonical shape above.
- A `LockFileSchema` validates writes round-trip cleanly.
- The cloud UI can fetch the file from GitHub and render a project's dashboard
  without importing any TS from the consumer repo.
