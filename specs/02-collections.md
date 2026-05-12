# Collections

**Status:** stable (core), v1-proposed (advanced options)
**Version:** v1

## Intent

A collection is a folder of similarly-shaped entries — typically `posts/*.md`, `authors/*.json`, `categories/*.json`. `createCollection` defines the shape and returns getters that read from disk and validate.

## API

```ts
// qino/collections/posts.ts
import { createCollection } from "qino";
import z from "zod";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z
  .object({
    title: z.string(),
    "created-on": z.string(),
    "updated-on": z.string(),
    categories: z.array(z.string()),
    image: z.string(),
    author: z.string(),
    markdown: z.string(),
  })
  .strict();

export const postCollection = createCollection({
  directory: "/posts", // relative to config.contentFolder; must start with "/"
  schema: PostSchema,
  extension: ".md", // ".md" | ".mdx" | ".json"
  relations: {
    author: authorCollection, // 1:1, leaf is a string field
    "categories[*]": categoryCollection, // 1:n, leaf is each element of a string array
  },
});
```

Any [Standard Schema](https://standardschema.dev)–compatible validator works (zod ≥ 3.24, Valibot, ArkType, Effect Schema, …). The runtime treats validation as a black box.

Source of truth: `packages/qino/src/runtime/create-collections/index.ts`.

## Behaviour

### Slug

Slug = relative path inside `directory`, minus the file extension: `/posts/hello.md` → slug `hello`

### Returned shape

Every entry returned by `getAll` / `getOne` includes a `_meta` field:

```ts
{
  _meta: {
    slug: string,        // "hello"
    fileName: string,    // "hello.md"
    filePath: string,    // absolute path on disk
  },
  ...validatedFields
}
```

### Markdown vs JSON

- `.md` and `.mdx` entries are parsed with `gray-matter`. Frontmatter fields are spread; the body is exposed as a `markdown` field on the entry. **The schema must include `markdown: z.string()`** if the body is needed.
- `.json` entries are parsed straight as JSON.
- Markdown → HTML conversion is **not** Qino's job. Consumers render `markdown` with their own MD/MDX pipeline.

### `getOne` signature

```ts
getOne(slug: string)
```

Positional, not object form. (The earlier draft of the spec used `getOne({ slug })` — that's not what shipped.)

### `relations`

Optional object on `createCollection` whose keys are **JSON-path strings** into the schema's validated output, and whose leaf type is `string`. Values are other collections or singletons (the object returned by another `createCollection` or `createSingleton` call) — or thunks `() => target` for forward references.

Path grammar:

- Object descent: `parent.child`
- Array descent: `field[*]` (each element)
- Leaf must be `string` after walking the path

Examples (against a schema like the one above plus a `test: { coco: string[], foo: { bar: string } }` field):

- `author` — top-level string
- `categories[*]` — each element of a `string[]`
- `test.foo.bar` — nested string
- `test.coco[*]` — each element of a nested `string[]`

Invalid paths (caught at compile time): keys that don't exist in the schema, paths landing on numbers/booleans/objects, or array fields without `[*]`.

Cardinality is derived from the path itself: any `[*]` anywhere in the key → `cardinality: "many"`; otherwise `cardinality: "one"`. `[*]` is transitive — `articles[*].author` yields many authors per entry, so it's `"many"` even though the leaf is a single field. No build-time data scan is needed.

The lock file records `field` (the path string), `target`, `kind` (`"collection"` or `"singleton"`), and `cardinality` for each relation; resolving relations into full entries (`resolveDescendants` / `resolveAncestors`) is described in `05-relationships.md`.

Relation values in content files are stored in verbose form (`author: "authors/jane-doe.json"`, not bare slugs) — see [05-relationships.md → Relation value format](05-relationships.md#relation-value-format).

## Getter options (`[v1-proposed]`)

The shape under consideration for `getAll`:

```ts
getAll({
  first?: number,
  last?: number,
  sort?: (a, b) => number,           // see 06-sort.md
  filter?: (entry) => boolean,
  resolveDescendants?: number | true, // see 05-relationships.md
  resolveAncestors?: number | true,
})
```

None of these are implemented yet. `getAll()` today takes no arguments.

## Open questions

- Filter signature: single fn, array of fns, predicate object?
- Default sort if none provided — file order? Creation date? Stable but undefined?

## Acceptance criteria

Done when:

- `getAll()` returns every entry in the collection folder, validated against the schema.
- `getOne(slug)` returns one entry by slug, throws on missing file or schema mismatch.
- `_meta.slug`, `_meta.fileName`, `_meta.filePath` are present on every returned entry.
- `.md` entries expose body via `markdown` (when present in schema); `.json` entries don't.
- Schema validation errors point at the file path that failed.
- Any Standard Schema validator (zod, Valibot, ArkType, …) is accepted; the runtime never calls validator-specific APIs.
- A `relations` map can declare JSON-path strings into the schema (e.g. `author`, `categories[*]`, `test.foo.bar`) as pointers to other collections; cardinality is derived from the path (`[*]` anywhere → `"many"`, else `"one"`).
