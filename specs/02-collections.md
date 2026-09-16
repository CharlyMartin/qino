# Collections

**Status:** stable
**Version:** v1

## Intent

A collection is a folder of similarly-shaped entries — typically `posts/*.md`, `authors/*.json`, `categories/*.json`. `defineCollection` defines the shape and returns getters for filename discovery or reading and validating content.

## API

```ts
// qino/collections/posts.ts
import { defineCollection } from "@qino/cms";
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
  })
  .strict();

export const postCollection = defineCollection({
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

Source of truth: `packages/cms/src/runtime/collections/define-collection.ts`.

## Behaviour

### Slug

Slug = relative path inside `directory`, minus the file extension: `/posts/hello.md` → slug `hello`

### Filename discovery

```ts
getAllSlugs(): Promise<Array<SlugFor<Dir>>>
```

This parameterless getter calls `globCollectionPaths`, removes only the configured
trailing extension, and sorts with `.sort()`. Collections are flat: nested files,
hidden files, and files with other extensions are excluded. Empty or missing
directories return `[]`, preserving the existing glob behavior. Dots elsewhere in
filenames remain part of the slug.

Discovery does not read or parse content, validate schemas, resolve relations, or
run augment callbacks or views. Malformed content still yields a slug. The return
type uses the collection's generated slug registry, falling back to `string[]`
when its directory is unregistered.

`getMany()` and `getOne()` read and validate content before applying the selected
view. The internal `readAll()` remains the source reader for CLI validation;
CLI collection slug generation uses `getAllSlugs()`.

`getAllSlugs()` is filesystem truth and ignores views, so it can disagree with a
filtering view: `getOne(slug)` throws for a slug the selected view excludes. Use
`getAllSlugs()` for route generation when the default view has no `filter`. When
a view filters, derive slugs from the viewed set instead:

```ts
const slugs = (await posts.getMany({ view })).map((entry) => entry._meta.slug);
```

`getMany()` is named for what it returns: the entries the selected view keeps,
which may be fewer than the files on disk.

### Returned shape

Every entry returned by `getMany` / `getOne` includes a `_meta` field:

```ts
{
  _meta: {
    slug: string,        // "hello"
    fileName: string,    // "hello.md"
    filePath: string,    // absolute path on disk
  },
  markdown: string, // When declared as z.string() in the schema
  ...validatedFields
}
```

### Markdown vs JSON

- Markdown files parse with `gray-matter`. Qino validates frontmatter together with the raw body as `markdown: string`. Declare `markdown: z.string()` to retain it or transform it in the schema. Undeclared fields follow validator behavior (strip, passthrough, or strict rejection). JSON parses directly.
- `.json` entries are parsed straight as JSON.
- Top-level `_meta` is reserved in content and schema input/output for every format. Markdown frontmatter cannot declare `markdown`, but schemas can. Typed declarations of `_meta` fail at registration; getters and CLI validation reject actual conflicts at runtime. Nested names and JSON `markdown` are ordinary fields.
- Markdown → HTML conversion is **not** Qino's job. Consumers render `markdown` with their own MD/MDX pipeline.

### `getOne` signature

```ts
getOne(slug: string, options?: { view?: CustomViewName })
```

Positional, not object form. (The earlier draft of the spec used `getOne({ slug })` — that's not what shipped.)

### `relations`

Optional object on `defineCollection` whose keys are **JSON-path strings** into the schema's validated output, and whose leaf type is `string`. Values are collections, trees, or items (the object returned by `defineCollection`, `defineTree`, or `defineItem`) — or thunks `() => target` for forward references.

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

The proposed lock file records `field` (the path string), `target`, `kind` (`"collection"`, `"tree"`, or `"item"`), and `cardinality` for each relation; resolving relations into full entries (`resolveRelations`) is described in `05-relationships.md`.

Relation values in content files are stored in verbose form (`author: "authors/jane-doe.json"`, not bare slugs) — see [05-relationships.md → Relation value format](05-relationships.md#relation-value-format).

## Getter options

`getMany({ view })` selects a declared named view; `getMany()` uses `views.default` when configured, or baseline behavior without views. `getOne(slug, { view })` selects the same entry shape and
throws if the selected view’s filter excludes it. Sorting only applies to `getMany()`. See [15-views](./15-views.md).

## Filter and sort

Collection views accept `filter(entry): boolean` and `sort(a, b): number`.
Configure default and custom callbacks with the collection's view helper; root callbacks are forbidden.
The order is validation → relation resolution → augment → filter → sort.
Callbacks receive the selected view's augmented entry shape. Filtering applies
to both `getMany()` and `getOne()`; sorting only applies to `getMany()`. They are synchronous and cannot be overridden at getter call sites.
Absent callbacks preserve all entries and discovery order. See
[06-sort](./06-sort.md) for examples and complete behavior.

Pagination remains a future consideration.

## Acceptance criteria

Done when:

- `getAllSlugs()` returns sorted, typed slugs from filenames without reading content or running callbacks.
- `getMany()` validates every entry, then returns the selected view’s filtered and sorted results.
- `getOne(slug)` returns one entry by slug, throws on missing file, schema mismatch, or exclusion by the selected view’s filter.
- `_meta.slug`, `_meta.fileName`, `_meta.filePath` are present on every returned entry.
- Markdown presence and type in getters follow schema output, including transformations.
- Schema validation errors point at the file path that failed.
- Any Standard Schema validator (zod, Valibot, ArkType, …) is accepted; the runtime never calls validator-specific APIs.
- A `relations` map can declare JSON-path strings into the schema (e.g. `author`, `categories[*]`, `test.foo.bar`) as pointers to other collections; cardinality is derived from the path (`[*]` anywhere → `"many"`, else `"one"`).
