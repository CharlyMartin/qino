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
  relativePath: "/posts", // relative to config.contentFolder; must start with "/"
  schema: PostSchema,
  extension: ".md", // ".md" | ".mdx" | ".json"
  relations: {
    author: authorCollection, // 1:1, schema field is string
    categories: categoryCollection, // 1:n, schema field is Array<string>
  },
});
```

Any [Standard Schema](https://standardschema.dev)–compatible validator works (zod ≥ 3.24, Valibot, ArkType, Effect Schema, …). The runtime treats validation as a black box.

Source of truth: `packages/qino/src/runtime/create-collections/index.ts`.

## Behaviour

### Slug

Slug = relative path inside `relativePath`, minus the file extension: `/posts/hello.md` → slug `hello`

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

Optional object on `createCollection` whose keys are fields of the schema (constrained at compile time to fields whose validated type is `string` or `Array<string>`). Values are other collections (the object returned by another `createCollection` call) — or thunks `() => collection` for forward references.

Cardinality is inferred from the schema's output type at the type level and verified from the validated data at build time:

- `string` field → 1:1 relation (`cardinality: "one"`)
- `Array<string>` field → 1:n relation (`cardinality: "many"`)

The lock file records `field`, `target`, and `cardinality` for each relation; resolving relations into full entries (`resolveDescendants` / `resolveAncestors`) is described in `05-relationships.md`.

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
- A `relations` map can declare which schema fields are paths to other collections; cardinality is inferred from the schema's output type and confirmed at build time.
