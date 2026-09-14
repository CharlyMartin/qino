# SPECS for qino

Qino is a flat-file Markdown CMS with two surfaces: an npm package for developers (IDE) and a cloud UI for content editors (browser). The cloud UI ships in **V2**; V1 is library + CLI only.

The full spec is split across topic files in [`specs/`](./specs). Start with the [overview](./specs/00-overview.md) for the mental model, glossary, and lifecycle.

## Index

| File                                                           | Status      | Topic                                                            |
| -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| [00-overview.md](./specs/00-overview.md)                       | stable      | Pitch, two-surface model, glossary, lifecycle, non-goals         |
| [01-config.md](./specs/01-config.md)                           | stable      | `createConfig`, `qino/config.ts`                                 |
| [02-collections.md](./specs/02-collections.md)                 | stable      | `createCollection`, `getMany`, `getOne`, slug rules               |
| [03-pages.md](./specs/03-pages.md)                             | v1-proposed | `createPage` — single-file content                               |
| [04-trees.md](./specs/04-trees.md)                             | v1-proposed | `createTree` — hierarchical/ordered content                      |
| [05-relationships.md](./specs/05-relationships.md)             | v1-proposed | Path API, `resolveAncestors` / `resolveDescendants`              |
| [06-sort.md](./specs/06-sort.md)                               | stable      | Collection `filter` / `sort`, typed view helper                  |
| [07-assets.md](./specs/07-assets.md)                           | v1-proposed | Asset typing, local/remote, filename patterns                    |
| [08-augment.md](./specs/08-augment.md)                         | v1-proposed | Derived fields                                                   |
| [09-timestamps.md](./specs/09-timestamps.md)                   | v1-proposed | `published-at` / `updated-at` markers                            |
| [10-cli.md](./specs/10-cli.md)                                 | mixed       | `qino build` (stable), `qino dev` (v1-proposed), generated types |
| [11-lock-file.md](./specs/11-lock-file.md)                     | stable      | `qino-lock.json` shape, schema, write path                       |
| [12-i18n.md](./specs/12-i18n.md)                               | v2-deferred | Locales                                                          |
| [13-cloud-ui.md](./specs/13-cloud-ui.md)                       | v2-deferred | Editor UI, write modes                                           |
| [14-upstream-resolution.md](./specs/14-upstream-resolution.md) | v2-deferred | Reverse relation traversal                                       |
| [15-views.md](./specs/15-views.md)                             | stable      | Named resolution and augment configurations                      |
| [decisions.md](./specs/decisions.md)                           | —           | Decision log                                                     |
| [ideas.md](./specs/ideas.md)                                   | —           | Running brainstorm                                               |

## Status legend

- `[stable]` — implemented and matches code
- `[v1-proposed]` — must ship in V1, design not yet finalised
- `[v2-deferred]` — out of scope for V1
- `[idea]` — brainstorm, not committed

## Canonical example

`examples/blog/` is the live reference implementation. Look there before inventing examples — every spec file links back to the relevant files in it.
