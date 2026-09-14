# Trees

**Status:** stable (core), v1-proposed (advanced options)
**Version:** v1

## Intent

A tree is a hierarchical, ordered set of entries — a docs sidebar, a nested category taxonomy, a multi-section landing page, a navigation menu. Structure and order matter as much as the entries themselves.

Distinct from a sorted collection because:

- Hierarchy is first-class — every node may have nested children.
- Order is explicit, set by an `_order.json` file per node.
- Mutations from the cloud UI (drag-to-reorder, nest/unnest) need a stable representation.

## Custom views

Declare custom views with `views: (view) => ({ default: view({}), detail: view({ ... }) })`.
The helper accepts only `resolveRelations` and `augment`; it does not offer
filter or sort. Unsupported callbacks, object-form `views`, and definitions
not created by `view()` are rejected. `views.default` is required when views are supplied. Omitting views uses baseline
behavior. Root view settings are forbidden, and custom views inherit no settings. See [15-views](./15-views.md).

## API

```ts
// qino/trees/docs.ts
import { defineTree } from "qino";
import z from "zod";

const DocsSchema = z
  .object({
    title: z.string(),
    body: z.string(),
  })
  .strict();

export const docsTree = defineTree({
  directory: "/docs", // relative to config.contentFolder; must start with "/"
  schema: DocsSchema,
  extension: ".md", // ".md" | ".mdx" | ".json"
  titleField: "title", // must be a key in `schema` whose value is `string`
  orderFileName: "_order.json", // optional, default "_order.json"
});
```

Any [Standard Schema](https://standardschema.dev)–compatible validator works. The runtime treats validation as a black box.

A tree's `directory` is **exclusive** — no other tree or collection may share or overlap it. Declaring two trees on overlapping paths → build error.

Source of truth (when implemented): `packages/qino/src/runtime/trees/define-tree.ts`.

## Behaviour

### Slug

Slug = relative path inside `directory`, minus the file extension:

- `/docs/introduction.md` → `introduction`
- `/docs/guides.md` → `guides`
- `/docs/guides/queries.md` → `guides/queries`

Slugs are globally unique within a tree. Duplicate slugs (e.g. `foo.md` and `foo.mdx` both resolving to `foo`) → build error.

### Markdown vs JSON

- `.md`, `.mdx`, and `.markdown` entries are parsed with `gray-matter`. Frontmatter fields are spread; the body is exposed as `body` inside the validated fields. **The schema must include `body: z.string()`** if the body is needed.
- `.json` entries are parsed straight as JSON.
- Markdown → HTML conversion is **not** Qino's job. Consumers render `data.body` with their own MD/MDX pipeline.

### `titleField`

Required. The schema key whose value titles each node in the returned tree. The TypeScript type system constrains it to keys of `schema` whose validated type is `string`; any other key is a compile error.

The same value appears in two places on a hydrated node: at the top-level `title` (for tree traversal) and inside `data.<titleField>` (because it's part of the validated entry). This is intentional — `title` is the contract used by `getTree`, `data` is the validated payload.

### `relations`

Optional. Same JSON-path grammar as collections — `parent.child`, `field[*]`, with `[*]` anywhere making the relation `cardinality: "many"`. Targets can be any collection, tree, or item, or a thunk for forward refs. See [05-relationships.md](05-relationships.md).

### `resolveRelations`

Same `true | number | false` semantics as collections/items, defaulting to `false`. Set it inside `views.default` or a custom view; root view settings are forbidden. `getEntry(slug, { view: "name" })` selects a declared custom view; omitting `view` selects the declared default, or baseline behavior without views. Explicit `"default"` selection is allowed when declared. Getter resolution overrides are removed. Structural tree navigation is unaffected. See [15-views](./15-views.md).

## Content-folder convention

Every node is file-backed via a sibling-file convention:

- **Leaves** are files: `introduction.md`, `installation.md`.
- **Sections** are a `<name>.<ext>` file alongside a same-named `<name>/` folder containing the children. The `.md` file's frontmatter titles the node; its body is the parent's content. The folder holds only children — never an `index.<ext>`.
- **Every non-empty `<name>/` folder must have a sibling `<name>.<ext>` file.** Missing → build error naming the folder and the expected sibling path. A section that's just a sidebar header (no body) is expressed with a minimal `<name>.<ext>` carrying only `titleField` in frontmatter.
- An empty `<name>/` folder (no entries) is silently ignored; `<name>.<ext>` next to it is treated as a leaf.

```text
content/docs/
  _order.json
  introduction.md
  installation.md
  guides.md
  guides/
    _order.json
    queries.md
    mutations.md
    caching.md
  react.md
  react/
    _order.json
    overview.md
    use-query.md
    use-mutation.md
```

## `_order.json`

One file per node (root and each subfolder). Optional.

```json
["introduction.md", "installation.md", "guides.md", "react.md"]
```

- Each entry is the filename relative to the folder, including its extension. Every tree node is anchored on a file (a `<name>/` folder must have a sibling `<name>.<ext>`), so the entry always names that anchor file.
- Entries are validated against the tree's configured extension; an entry that doesn't end in it is a build error.
- Files present on disk but not listed in `_order.json` are appended after listed entries in filesystem order (loose semantics).
- Entries in `_order.json` referencing files that don't exist → build error, naming the offending entry and the `_order.json` path.
- If `_order.json` is absent, the order at that node is filesystem order.

`_order.json` lives alongside content rather than next to the tree definition: the content folder remains the single source of truth for what exists and in what order. It's one of the rare instances where Qino touches the content folder. Usually, it sits on top of it and the content folder shouldn't be aware of Qino at all. But in this case, for DX purposes, it's better to have the order file next to the content it describes rather than buried in the tree definition.

## Returned shapes

`TreeNode` skeletons (returned by `getTree`) use flat meta — `slug`, `title`, `fileName`, `filePath`, and `children` are top-level siblings — because tree nodes are walked and terse top-level keys read better in traversal code.

`TreeEntry` (returned by `getEntry`) uses the same `_meta` + spread layout as collections and items. `getEntry` is a leaf-level read, so consistency with the other primitives wins here.

`TreeNode` (skeleton, returned by `getTree`):

```ts
type TreeNode = {
  slug: string; // "guides", "guides/queries"
  title: string; // from titleField in the node's frontmatter
  fileName: string; // "guides.md", "queries.md", ...
  filePath: string; // absolute path on disk
  children: TreeNode[]; // always [], never null
};
```

`Entry` (returned by `getEntry`):

```ts
type TreeEntry = {
  _meta: {
    slug: string;
    fileName: string;
    filePath: string;
  };
} & ValidatedFields; // from the schema, e.g. { title: string, body: string, author: string, ... }
```

## Getters

### `getTree`

```ts
getTree(): Promise<TreeNode[]>
getTree(slug: string): Promise<TreeNode>
```

Without an argument, returns the whole tree as root-level `TreeNode[]` with full nesting. With a slug, returns the single `TreeNode` at that slug with its nested children. Throws if `slug` doesn't exist.

Slug syntax: slash notation matching the rest of the API.

```ts
const tree = await docsTree.getTree();
const guides = await docsTree.getTree("guides");
```

```json
[
  {
    "slug": "introduction",
    "title": "Introduction",
    "fileName": "introduction.md",
    "filePath": "/abs/content/docs/introduction.md",
    "children": []
  },
  {
    "slug": "guides",
    "title": "Guides",
    "fileName": "guides.md",
    "filePath": "/abs/content/docs/guides.md",
    "children": [
      {
        "slug": "guides/queries",
        "title": "Queries",
        "fileName": "queries.md",
        "filePath": "/abs/content/docs/guides/queries.md",
        "children": []
      }
    ] // The children should be ordered according to _order.json if it exists, otherwise filesystem order
  }
]
```

### `getEntry`

```ts
getEntry(slug: string): Promise<TreeEntry>
```

Returns a single entry by slug, shape `{ _meta: { slug, fileName, filePath }, ...validatedFields }`. Throws if the slug doesn't exist or if schema validation fails (with the offending file path in the error).

```ts
const entry = await docsTree.getEntry("guides/queries");
```

There is intentionally **no flat `getMany`** — trees are about hierarchy. To produce a flat list, walk the hydrated tree.

### `getEntries`

For V2, consider adding a getEntries function that would take in a TreeNode or TreeNode[] and return the hydrated equivalent.

API to be defined.

## Lock-file entry

```json
"trees": {
  "/docs": {
    "directory": "/docs",
    "extension": ".md",
    "titleField": "title",
    "relations": [
      { "field": "author", "target": "/authors", "kind": "collection", "cardinality": "one" }
    ]
  }
}
```

The `kind` discriminator on each relation tells consumers reading the lock file whether the target is a collection, tree, or item — same convention as on collections and items.

## Build pipeline

`qino build` walks `qino/trees/*.{ts,tsx,js,mjs}`, and for each tree:

1. Validates every file in the tree's directory against the schema.
2. Asserts every non-empty `<name>/` subfolder has a sibling parent file `<name>.<ext>`; missing → build error.
3. Asserts no duplicate slugs.
4. Asserts every entry referenced by an `_order.json` exists on disk.
5. Emits the lock-file entry under `trees.<directory>`.

The `qino/trees/` folder is **optional** — projects with no trees skip it without error.

## Open questions

- **Cloud-UI reorder write path** — drag-to-reorder in the dashboard commits to `_order.json` on a branch. Moves must keep `foo.<ext>` and `foo/` paired across reparenting/rename. Wire-format and conflict resolution deferred to V2.
- **`_order.json` metadata** — should `_order.json` eventually support per-entry metadata (e.g. `hidden: true`, `external: "https://..."`)? Defer until a real consumer needs it; if added, the bare-filename form must remain valid.
- **Future tree filtering** — consider predicates for hiding drafts or excluding entries from navigation. Filtering is out of scope for now. Decide whether excluding a parent removes its entire subtree or preserves/promotes its children, and how predicates interact with entry hydration and views. Trees continue to use `_order.json` for sorting. Collection filter/sort callbacks do not apply to trees.

## Acceptance criteria

Done when:

- `defineTree` is implemented with at least one canonical example in `examples/docs/` (to be created).
- `getTree()` returns root-level `TreeNode[]` with full nesting; `getTree(slug)` returns a single `TreeNode`; both throw on invalid slugs.
- `getEntry(slug)` returns a single `Entry`; throws on missing slug or schema mismatch with the offending file path in the error.
- Slug derivation produces unique slugs across the tree; duplicate slugs fail at build.
- Every non-empty subfolder has a sibling parent file `<name>.<ext>`; missing → build error naming the folder and the expected file path.
- `_order.json` is honoured per node; missing files are appended in filesystem order; references to non-existent files throw at build with a clear message.
- A tree's `directory` overlapping another tree or collection's directory throws at build.
- `qino-lock.json` includes a `trees.<id>` entry with `directory`, `extension`, `titleField`, and `relations`.
- Any Standard Schema validator (zod, Valibot, ArkType, …) is accepted; the runtime never calls validator-specific APIs.
- A `relations` map can declare JSON-path strings against the schema (`author`, `categories[*]`, `test.foo.bar`); cardinality is derived from the path.
