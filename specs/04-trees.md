# Trees

**Status:** v1-proposed (API not yet sketched)
**Version:** v1

## Intent

A tree is a hierarchical, ordered set of entries. The use case is content where structure and order matter as much as the entries themselves: a docs sidebar, a nested category taxonomy, a multi-section landing page.

Distinct from a sorted collection because:

- Hierarchy is a first-class field, not derived from filename or frontmatter.
- Order is explicit, not computed by a sort fn.
- Mutations from the cloud UI (drag-to-reorder, nest/unnest) need a stable representation.

## API (sketch — not finalised)

```ts
// qino/trees/docs.ts
import { createTree } from "qino";
import z from "zod";

export const getDocsTree = createTree({
  path: "docs",                  // folder of .md entries
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
  }),
  order: "docs/_tree.json",      // explicit hierarchy file
});
```

The order file describes the tree:

```json
[
  { "slug": "getting-started" },
  {
    "slug": "guides",
    "children": [
      { "slug": "guides/installation" },
      { "slug": "guides/configuration" }
    ]
  }
]
```

The getter returns a recursive structure:

```ts
const tree = await getDocsTree();
// [{ entry, children: [{ entry, children: [...] }, ...] }, ...]
```

## Open questions

- Is the tree always backed by an explicit JSON order file, or can it be derived from folder nesting?
- Should the JSON file live alongside content (`docs/_tree.json`) or beside the definition (`qino/trees/docs.json`)?
- Naming: `createTree`, `createHierarchy`, `createOutline`?
- How does the cloud UI commit reorder operations — write the JSON file, write a frontmatter `order` field, or both?
- Does a tree own its content folder, or can multiple trees / collections share?

## Acceptance criteria

Done when:

- `createTree` is implemented with at least one canonical example in `apps/blog/` (or a docs app).
- The tree shape is reflected in `qino-lock.json` under `trees.<id>`.
- `getDocsTree()` returns nodes typed against the schema.
