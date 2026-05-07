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

export const { getAll: getAllPosts, getOne: getPost } = createCollection({
  path: "posts",         // relative to config.contentFolder
  schema: PostSchema,
  extention: ".md",      // ".md" | ".mdx" | ".json"
});
```

Source of truth: `packages/qino/src/runtime/create-collection.ts`.

> Spelling note: the field is currently `extention` in the codebase (typo). To be renamed to `extension` to match `qino-lock.json` and the spec — see `specs/decisions.md` once that lands.

## Behaviour

### Slug

Slug = relative path inside `path`, minus the file extension.

- `posts/hello.md` → slug `hello`
- `posts/2026/launch.md` → slug `2026/launch`

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

- `extention` → `extension` rename in code.
- Filter signature: single fn, array of fns, predicate object?
- Default sort if none provided — file order? Creation date? Stable but undefined?

## Acceptance criteria

Done when:

- `getAll()` returns every entry in the collection folder, validated against the schema.
- `getOne(slug)` returns one entry by slug, throws on missing file or schema mismatch.
- `_meta.slug`, `_meta.fileName`, `_meta.filePath` are present on every returned entry.
- `.md` entries expose body via `markdown` (when present in schema); `.json` entries don't.
- Schema validation errors point at the file path that failed.
