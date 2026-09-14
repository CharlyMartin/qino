# Code Audit — Deep Scan

**Date:** 2026-06-10
**Scope:** full monorepo — `packages/qino` (lib, runtime, types, utils, CLI), root configs, `examples/blog`.
**Method:** three parallel scans (core lib / runtime+types / CLI+tooling+app), every flagged finding then verified against source. False positives discarded (see last section).

Each finding is rated on two criteria:

- **Urgency** — how likely it is to cause real problems (or how much it blocks the project's stated goals).
- **Feasibility** — effort to fix: `trivial` (minutes), `small` (< 1h), `medium` (a work session or more).

## Summary matrix

| #   | Finding                                          | Urgency | Feasibility |
| --- | ------------------------------------------------ | ------- | ----------- |
| 1   | `qino build` is an empty stub                    | High    | Medium      |
| 2   | Lint validation step fully commented out         | High    | Small       |
| 3   | No direct tests for core runtime creators        | High    | Medium      |
| 4   | `lint` script/task missing everywhere            | High    | Trivial     |
| 5   | Raw `ENOENT` errors leak without Qino context    | Medium  | Small       |
| 6   | Relation-resolution block duplicated ×4          | Medium  | Small       |
| 7   | Markdown frontmatter errors lack file context    | Medium  | Small       |
| 8   | Stale docs (specs + CLAUDE.md + CLI usage)       | Medium  | Trivial     |
| 9   | Dead code: unreachable throw in `findNode`       | Low     | Trivial     |
| 10  | Dead code: unused `extension` param              | Low     | Trivial     |
| 11  | Dead code: `docsTreeV1` never imported           | Low     | Trivial     |
| 12  | Case-sensitive extension routing                 | Low     | Trivial     |
| 13  | Relation values not trimmed                      | Low     | Small       |
| 14  | Inconsistent error-message prefixes              | Low     | Trivial     |
| 15  | Redundant type casts                             | Low     | Trivial     |
| 16  | Untested utils                                   | Low     | Small       |
| 17  | Untested edge cases (empty slug, deep trees)     | Low     | Trivial     |
| 18  | Blog scaffolding leftovers                       | Low     | Trivial     |

**Suggested order of attack:** 4 → 2 → 9/10/11 → 5 → 3 → 1 (quick wins first, then the two big-ticket items).

## High urgency

### 1. `qino build` is an empty stub

`packages/qino/src/cli/build/index.ts:1-5`

```ts
export async function build() {
  // TODO
  // [ ] Generate types from content data, all the slugs, the schema types, etc.
  // [ ] Generate the schema.json if the user sets the option to true.
}
```

The flagship CLI command does nothing beyond running `lint` first (`cli/index.ts:12-14`). Per `specs/10-cli.md`, build should emit generated `.d.ts` types and optionally `schema.json`. Until this exists, the type-generation pillar of the product is missing.

**Fix:** implement type generation per spec. **Feasibility: medium** — this is feature work, not a patch.

### 2. Lint validation step fully commented out

`packages/qino/src/cli/lint/index.ts:63-107`

`validateCollection`, `validateSingleton`, `validateTree`, and `countNodes` are written but entirely commented out, and the TODOs at lines 50-54 list the invariants they were meant to check (schema validation passes, paths valid, empty-collection warnings). Spec step 8 requires exercising getters with `resolveRelations: false`. Today `qino lint` greenlights setups whose content fails schema validation.

**Fix:** reactivate (or rewrite) the validators, wire them into `lint()`, add tests. **Feasibility: small** — the code already exists.

### 3. No direct tests for core runtime creators

- `runtime/collections/create-collection.ts` — 178 lines (getAll, getOne, relation resolution, caching), no `create-collection.test.ts`
- `runtime/singletons/create-singleton.ts` — no test file
- `runtime/singletons/build-singleton-meta.ts` — no test file

These are only exercised indirectly via `create-qino.test.ts`, violating the repo's own convention (CLAUDE.md: "Important functions should also have a test file with the same name"). The trees module follows the convention; collections/singletons don't.

**Fix:** add direct test files covering getAll/getOne/getData happy paths, missing files, `resolveRelations` variants, nested slugs. **Feasibility: medium.**

### 4. `lint` script/task missing everywhere

CLAUDE.md documents `pnpm lint` → `turbo run lint`, but:

- root `package.json` has no `lint` script
- `turbo.json` has no `lint` task
- `packages/qino/package.json` has no `lint` script (CLAUDE.md says every package needs `build`, `lint`, `check-types`)

`pnpm lint` currently fails. **Fix:** add the three missing pieces (e.g. `biome check .` per package). **Feasibility: trivial.**

## Medium urgency

### 5. Raw `ENOENT` errors leak without Qino context

Three getter sites call `fs.readFile` bare:

- `runtime/collections/create-collection.ts:147` (`getOne`)
- `runtime/singletons/create-singleton.ts:80` (`getData`)
- `runtime/trees/create-tree.ts:125` (`getEntry`)

A typo'd slug surfaces as `ENOENT: no such file or directory, open '...'` with no mention of which collection/singleton/slug failed. Contrast `build-node.ts:38-42`, which wraps errors with context.

**Fix:** wrap reads, e.g. `` `Collection "${directory}": entry "${slug}" not found at ${meta.filePath}` ``. **Feasibility: small.**

### 6. Relation-resolution block duplicated ×4

The identical cache → resolver → `normalizeDepth` → `resolveEntry` → cast sequence appears in:

- `create-collection.ts:120-134` (getAll) and `:165-175` (getOne)
- `create-singleton.ts:98-108` (getData)
- `create-tree.ts:143-154` (getEntry)

**Fix:** extract a `resolve-entry-if-needed.ts` helper in `lib/relations/`. **Feasibility: small.**

### 7. Markdown frontmatter errors lack file context

`lib/parse/parse-markdown-file.ts:18` calls `matter(data)` unguarded. Invalid YAML frontmatter throws a raw gray-matter/js-yaml error without `filePath`, while validation errors do carry the path. With many content files, the user can't tell which file is broken.

**Fix:** wrap `matter()` and rethrow with `filePath`. Same applies to `JSON.parse` in `parse-json-file.ts`. **Feasibility: small.**

### 8. Stale docs

- `specs/10-cli.md:39` — "Source of truth: `packages/qino/src/cli/build/run-build.ts`" — file doesn't exist (it's `cli/build/index.ts`).
- CLAUDE.md — turbo-outputs note ("adjust turbo.json if a package emits to dist/") is outdated; `turbo.json:8` already lists `dist/**`.
- CLAUDE.md — `pnpm format` described as "Prettier on `**/*.{ts,tsx,md}`"; it's now prettier for md + biome for code.
- CLAUDE.md mentions `qino watch`; not implemented in `cli/index.ts`.
- `cli/index.ts:20` usage text lists only `build`, omitting the working `lint` command.

**Fix:** doc updates only. **Feasibility: trivial.**

## Low urgency

### 9. Dead code: unreachable throw in `findNode`

`runtime/trees/find-node.ts:24-28`. The loop body (lines 13-22) either throws or assigns `found` on every iteration, and `slug.split("/")` never yields an empty array, so the post-loop `if (!found)` can never fire. **Fix:** delete the block. **Feasibility: trivial.**

### 10. Dead code: unused `extension` param in `buildNode`

`runtime/trees/build-node.ts:15` declares `extension` in `BuildTreeNodeParams`; the function never destructures it. `walkTree:73` passes it for nothing. **Fix:** remove from type and call site. **Feasibility: trivial.**

### 11. Dead code: `docsTreeV1`

`examples/blog/qino/trees/docs.ts:12` exports `docsTreeV1`; nothing imports it. Keep only if it's a deliberate demo of multi-version trees — then reference it somewhere or comment why. **Feasibility: trivial.**

### 12. Case-sensitive extension routing

`lib/parse/parse-file.ts:16` (`filePath.endsWith(".json")`) and `utils/extract-extension.ts` are case-sensitive: `entry.JSON` would be parsed as Markdown. macOS filesystems are case-insensitive, so a casing mismatch won't fail at read time — it will silently mis-parse. **Fix:** lowercase before comparing. **Feasibility: trivial.**

### 13. Relation values not trimmed

`lib/relations/resolve-relation-leaf.ts` rejects `""` but accepts `" authors/jane.json "`, which then silently fails collection-prefix matching. Hand-edited YAML makes stray whitespace plausible. **Fix:** trim before validating, add tests. **Feasibility: small.**

### 14. Inconsistent error-message prefixes

`walk-tree.ts:86-88` prefixes with `Tree:` + relative folder; `get-ordered-nodes.ts:24-26` prefixes with the absolute `_order` file path. Pick one convention (path-first is more actionable). **Feasibility: trivial.**

### 15. Redundant type casts

- `build-singleton-meta.ts:13-14` — casts to a template-literal type the input already has.
- `create-collection.ts:53` / `create-singleton.ts:52` — `(relations ?? {}) as Rels` hides widening; same with `(resolveRelations ?? true) as ResolveOption`.

Safe today, but `as` casts mask future type errors. **Fix:** drop redundant ones; comment the intentional ones. **Feasibility: trivial.**

### 16. Untested utils

No test files for: `remove-extension`, `remove-leading-slash`, `assert-file`, `assert-directory`, `is-file`, `is-directory`, `assert-qino-primitive`. Notably `remove-extension` underpins `getOrderedNodes` matching. **Feasibility: small.**

### 17. Untested edge cases

- Empty slug into `findNode` / `getOne` (currently throws/reads a weird path — behavior should be pinned by a test).
- Trees deeper than 3 levels (current max in tests).
- Single-segment vs trailing-slash slugs.

**Feasibility: trivial** (a handful of test cases).

### 18. Blog scaffolding leftovers

- `examples/blog/src/app/layout.tsx:16-17` — still `title: "Create Next App"`.
- zod import style mixed: `import z from "zod"` (home.ts, authors.ts, categories.ts, docs.ts) vs `import { z } from "zod"` (posts.ts). Both work in zod 4; pick one.

**Feasibility: trivial.**

## Discarded non-issues

Flagged during the scan but verified as fine — listed so future audits don't re-report them:

1. **`exports` pointing to `src/index.ts`** in `packages/qino/package.json` — intentional dev-time pattern; `publishConfig.exports` correctly remaps to `dist/` for publishing.
2. **Prettier + Biome coexistence** — deliberate split: prettier formats markdown, biome handles code (`format:md` / `format:code`).
3. **`import z from "zod"`** — zod 4 ships a default export; this is a style inconsistency (see #18), not a bug.
