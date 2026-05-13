# Trees

**Status:** stable (core), v1-proposed (advanced options)
**Version:** v1

## Intent

A tree is a hierarchical, ordered set of entries — a docs sidebar, a nested category taxonomy, a multi-section landing page, a navigation menu. Structure and order matter as much as the entries themselves.

Distinct from a sorted collection because:

- Hierarchy is first-class — every node may have nested children.
- Order is explicit, set by an `_order.json` file per node.
- Mutations from the cloud UI (drag-to-reorder, nest/unnest) need a stable representation.

## API

```ts
// qino/trees/docs.ts
import { createTree } from "qino";
import z from "zod";

const DocsSchema = z
  .object({
    title: z.string(),
    markdown: z.string(),
  })
  .strict();

export const docsTree = createTree({
  directory: "/docs", // relative to config.contentFolder; must start with "/"
  schema: DocsSchema,
  extension: ".md", // ".md" | ".mdx" | ".json"
  titleField: "title", // must be a key in `schema` whose value is `string`
});
```

Any [Standard Schema](https://standardschema.dev)–compatible validator works. The runtime treats validation as a black box.

Source of truth (when implemented): `packages/qino/src/runtime/create-tree/index.ts`.

## Behaviour

### Slug

Slug = relative path inside `directory`, minus the file extension, with a trailing `index` segment stripped:

- `/docs/introduction.md` → `introduction`
- `/docs/guides/index.md` → `guides`
- `/docs/guides/queries.md` → `guides/queries`

Slugs are globally unique within a tree. Duplicate slugs (e.g. `foo.md` and `foo/index.md` both resolving to `foo`) → build error.

### Markdown vs JSON

- `.md` and `.mdx` entries are parsed with `gray-matter`. Frontmatter fields are spread; the body is exposed as `markdown` inside the validated fields. **The schema must include `markdown: z.string()`** if the body is needed.
- `.json` entries are parsed straight as JSON.
- Markdown → HTML conversion is **not** Qino's job. Consumers render `data.markdown` with their own MD/MDX pipeline.

### `titleField`

Required. The schema key whose value titles each node in the returned tree. The TypeScript type system constrains it to keys of `schema` whose validated type is `string`; any other key is a compile error.

The same value appears in two places on a hydrated node: at the top-level `title` (for tree traversal) and inside `data.<titleField>` (because it's part of the validated entry). This is intentional — `title` is the contract used by `getTree`, `data` is the validated payload.

### `relations`

Optional. Same JSON-path grammar as collections — `parent.child`, `field[*]`, with `[*]` anywhere making the relation `cardinality: "many"`. Targets can be any collection or singleton, or a thunk for forward refs. See [05-relationships.md](05-relationships.md).

### `resolveRelations`

Same `true | number | false` semantics as collections/singletons. Settable on `createTree` and overridable per getter call (`getEntries`, `getEntry`).

## Content-folder convention

Every node is file-backed via an `index` convention:

- **Leaves** are files: `introduction.md`, `installation.md`.
- **Parents** put their content in an `index.<ext>` file inside the folder: `guides/index.md`. The frontmatter's `titleField` titles the node; the body is the parent's content.
- **Every subfolder must contain an `index.<ext>`**. Missing → build error. A section that's just a sidebar header (no body) is expressed with a minimal `index.md` carrying only `titleField` in frontmatter.

```text
content/docs/
  _order.json
  introduction.md
  installation.md
  guides/
    _order.json
    index.md
    queries.md
    mutations.md
    caching.md
  react/
    _order.json
    index.md
    overview.md
    use-query.md
    use-mutation.md
```

`index.<ext>` directly under `directory` is **not allowed** — the tree itself is the root. Build error if found.

A tree's `directory` is **exclusive** — no other tree or collection may share or overlap it. Declaring two trees on overlapping paths → build error.

## `_order.json`

One file per node (root and each subfolder). Optional.

```json
["introduction", "installation", "guides", "react"]
```

- Each entry is a bare slug relative to the folder, no extension. Folder names and file names use the same syntax (e.g. `"guides"` covers both `guides/` and the implicit `guides/index.md`).
- Files present on disk but not listed in `_order.json` are appended after listed entries in filesystem order (loose semantics).
- Entries in `_order.json` referencing files that don't exist → build error, naming the offending entry and the `_order.json` path.
- If `_order.json` is absent, the order at that node is filesystem order.

`_order.json` lives alongside content rather than next to the tree definition: the content folder remains the single source of truth for what exists and in what order.

## Returned shapes

Tree nodes use **flat meta** — `slug`, `fileName`, `filePath`, `title`, and `children` are top-level siblings. Validated schema fields are nested under `data`. This diverges from collections/singletons (which spread fields beside `_meta`) on purpose: tree nodes are walked, so terse top-level keys read better and namespacing schema fields under `data` removes any field-collision risk.

`NodeTree` (skeleton, returned by `getTree`):

```ts
{
  slug: string,         // "guides", "guides/queries"
  title: string,        // from titleField in the node's frontmatter
  fileName: string,     // "index.md", "queries.md", ...
  filePath: string,     // absolute path on disk
  children: NodeTree[], // always [], never null
}
```

`HydratedNodeTree` (returned by `getEntries`):

```ts
type HydratedNodeTree = NodeTree & { data: ValidatedFields }
```

`Entry` (returned by `getEntry`):

```ts
{
  slug: string,
  fileName: string,
  filePath: string,
  data: ValidatedFields,
}
```

The only schema key a user must avoid is the literal `data` field — flagged as a build-time error if encountered.

## Getters

### `getTree`

```ts
getTree(): Promise<NodeTree[]>
getTree(slug: string): Promise<NodeTree>
```

Without an argument, returns the whole tree as root-level `NodeTree[]` with full nesting. With a slug, returns the single `NodeTree` at that slug with its nested children. Throws if `slug` doesn't exist.

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
    "fileName": "index.md",
    "filePath": "/abs/content/docs/guides/index.md",
    "children": [
      {
        "slug": "guides/queries",
        "title": "Queries",
        "fileName": "queries.md",
        "filePath": "/abs/content/docs/guides/queries.md",
        "children": []
      }
    ]
  }
]
```

### `getEntries`

```ts
getEntries(node: NodeTree): Promise<HydratedNodeTree>
getEntries(tree: NodeTree[]): Promise<HydratedNodeTree[]>
```

Hydrates a skeleton tree (or single node) into a hydrated tree. Each node gains `data: validatedFields` from reading, parsing, and validating its file. Children are hydrated recursively.

```ts
const tree = await docsTree.getTree();
const hydrated = await docsTree.getEntries(tree);

const guides = await docsTree.getTree("guides");
const hydratedGuides = await docsTree.getEntries(guides);
```

The two-step pattern (`getTree` then `getEntries`) lets consumers prune the skeleton client-side before paying for hydration — useful for partial reads like rendering only the open section of a sidebar.

### `getEntry`

```ts
getEntry(slug: string): Promise<Entry>
```

Returns a single entry by slug, shape `{ slug, fileName, filePath, data: ValidatedFields }`. Throws if the slug doesn't exist or if schema validation fails (with the offending file path in the error).

```ts
const entry = await docsTree.getEntry("guides/queries");
```

There is intentionally **no flat `getAll`** — trees are about hierarchy. To produce a flat list, walk the hydrated tree.

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

The `kind` discriminator on each relation tells consumers reading the lock file whether the target is a collection or a singleton — same convention as on collections and singletons.

## Build pipeline

`qino build` walks `qino/trees/*.{ts,tsx,js,mjs}`, and for each tree:

1. Validates every file in the tree's directory against the schema.
2. Asserts every subfolder contains an `index.<ext>`.
3. Asserts no `index.<ext>` sits directly under `directory`.
4. Asserts no duplicate slugs.
5. Asserts every entry referenced by an `_order.json` exists on disk.
6. Emits the lock-file entry under `trees.<directory>`.

The `qino/trees/` folder is **optional** — projects with no trees skip it without error.

## Open questions

- **Cloud-UI reorder write path** — drag-to-reorder in the dashboard commits to `_order.json` on a branch. Wire-format and conflict resolution deferred to V2.
- **`_order.json` metadata** — should `_order.json` eventually support per-entry metadata (e.g. `hidden: true`, `external: "https://..."`)? Defer until a real consumer needs it; if added, the bare-slug form must remain valid.
- **Getter options parity** — collections plan a `getAll({ first, last, sort, filter, ... })` shape. Whether `getEntries` grows analogous options (filter by predicate before hydrating, limit by depth) is open.

## Acceptance criteria

Done when:

- `createTree` is implemented with at least one canonical example in `apps/docs/` (to be created).
- `getTree()` returns root-level `NodeTree[]` with full nesting; `getTree(slug)` returns a single `NodeTree`; both throw on invalid slugs.
- `getEntries(node | tree)` returns the hydrated equivalent with `data: ValidatedFields` on every node; children hydrate recursively.
- `getEntry(slug)` returns a single `Entry`; throws on missing slug or schema mismatch with the offending file path in the error.
- Slug derivation strips a trailing `/index` segment and produces unique slugs across the tree; duplicate slugs fail at build.
- `index.<ext>` is required in every subfolder; missing → build error. `index.<ext>` directly under `directory` → build error.
- `_order.json` is honoured per node; missing files are appended in filesystem order; references to non-existent files throw at build with a clear message.
- A tree's `directory` overlapping another tree or collection's directory throws at build.
- `qino-lock.json` includes a `trees.<id>` entry with `directory`, `extension`, `titleField`, and `relations`.
- Any Standard Schema validator (zod, Valibot, ArkType, …) is accepted; the runtime never calls validator-specific APIs.
- A `relations` map can declare JSON-path strings against the schema (`author`, `categories[*]`, `test.foo.bar`); cardinality is derived from the path.
