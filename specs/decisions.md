# Decisions

A running log of design decisions. Append-only — supersede with a new entry rather than editing old ones. Each entry: date, decision, why.

---

## 2026-05-07 — `collection`, `page`, and `tree` are three distinct concepts

**Decision:** Keep three separate APIs (`createCollection`, `createPage`, `createTree`).

**Why:** A page is not a one-entry collection — it's a single well-known content file with its own role (home, about). A tree is not a sorted collection — it has hierarchy and ordering as first-class properties. Collapsing them would force consumers to express role/hierarchy semantics through ad-hoc conventions.

**Implications:** Each gets its own spec file (`03-pages.md`, `04-trees.md`).

---

## 2026-05-07 — V1 = library + CLI only; cloud UI is V2

**Decision:** Ship the npm package and CLI first. Cloud UI ships in V2.

**Why:** The npm side is self-contained and unblocks dogfooding via `examples/next-js/`. The cloud UI depends on a stable lock-file format and write protocol; both mature faster with real V1 usage.

**Implications:** `13-cloud-ui.md` is `[v2-deferred]`. Lock-file schema (`11-lock-file.md`) is treated as forward-compatible from V1.

---

## 2026-05-07 — V1 feature scope

**Decision:** V1 ships:

- `createConfig`, `createCollection`, `createPage`, `createTree`
- Relationships (Path API)
- Sort
- Asset/image typing
- `augment` (derived fields)
- Auto timestamps (API TBD, but ships in V1 if the API lands)
- CLI: `qino build`, `qino dev`
- Generated `.d.ts` types

V2 ships:

- i18n
- Cloud UI

**Why:** V1 must be useful for a real consumer (`examples/next-js/`) without manual workarounds for relations, sort, or assets. i18n and cloud UI are large enough to warrant their own release cycle.

---

## 2026-05-07 — Cloud UI write model: both modes

**Decision:** When the cloud UI ships in V2, editors will be able to choose per-edit between (a) committing directly to the default branch and publishing instantly, or (b) opening a PR for review.

**Why:** Different editorial workflows. Solo authors want speed; teams want review. No reason to force one model.

**Implications:** Captured in `13-cloud-ui.md`.

---

## 2026-09-14 — Use `defineItem`, `defineCollection`, and `defineTree`

**Decision:** Rename `createSingleton` to `defineItem`, `createCollection` to `defineCollection`, and `createTree` to `defineTree`. Use item terminology throughout the API, types, CLI, and documentation. Keep `createQino` as the instance factory.

**Why:** These helpers declare content sources and schemas. “Define” communicates that purpose, and “item” is more approachable than “singleton” while covering both pages and settings.

**Implications:** This is a breaking rename with no compatibility aliases. Single-file definitions use `qino/items/`; the public types are `Item` and `ItemEntryMeta`. See [03-items.md](03-items.md).
